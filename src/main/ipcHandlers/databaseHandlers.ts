/**
 * @fileoverview ゲーム管理に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのゲーム操作リクエストを処理します。
 * - ゲーム一覧の取得（検索・フィルタ・ソート機能付き）
 * - ゲーム詳細情報の取得
 * - ゲームの作成・更新・削除
 * - プレイセッションの記録とプレイ時間の管理
 *
 * すべての操作はPrismaを通してSQLiteデータベースに対して実行されます。
 * エラーハンドリングではPrismaの既知エラー（重複エラーなど）を適切に処理し、
 * ユーザーフレンドリーなメッセージを返します。
 */

import { ipcMain } from "electron"
import { prisma } from "../db"
import { PlayStatus, Prisma } from "@prisma/client"
import type { FilterOption, SortOption } from "../../types/menu"
import type { InputGameData, GameType, PlaySessionType } from "../../types/game"
import { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"
import { MESSAGES } from "../../constants"
import { ensureDefaultChapter } from "./chapterHandlers"
import { transformGame, transformGames, transformPlaySessions } from "../utils/dataTransform"

type GameUpdateData = {
  title: string
  publisher: string
  saveFolderPath: string | null
  exePath: string
  imagePath: string | null
  playStatus: PlayStatus
  clearedAt?: Date | null
}

const filterMap: Record<FilterOption, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}
const sortMap: Record<SortOption, { [key: string]: "asc" | "desc" }> = {
  title: { title: "asc" },
  lastPlayed: { lastPlayed: "desc" },
  totalPlayTime: { totalPlayTime: "desc" },
  publisher: { publisher: "asc" },
  lastRegistered: { createdAt: "desc" }
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle(
    "list-games",
    async (
      _event,
      searchWord: string,
      filter: FilterOption,
      sort: SortOption
    ): Promise<GameType[]> => {
      try {
        // 文字検索
        const searchCondition: Prisma.GameWhereInput = searchWord
          ? {
              OR: [{ title: { contains: searchWord } }, { publisher: { contains: searchWord } }]
            }
          : {}

        // フィルター指定
        const filterCondition = filterMap[filter]

        // ソート順指定
        const orderBy = sortMap[sort]

        const games = await prisma.game.findMany({
          where: { AND: [searchCondition, filterCondition] },
          orderBy
        })
        return transformGames(games)
      } catch (error) {
        logger.error("ゲーム一覧取得エラー:", error)
        return []
      }
    }
  )

  ipcMain.handle("get-game-by-id", async (_event, id: string): Promise<GameType | undefined> => {
    try {
      const game = await prisma.game.findFirst({
        where: { id }
      })
      return game ? transformGame(game) : undefined
    } catch (error) {
      logger.error("ゲーム詳細取得エラー:", error)
      return undefined
    }
  })

  ipcMain.handle(
    "get-play-sessions",
    async (_event, gameId: string): Promise<ApiResult<PlaySessionType[]>> => {
      try {
        const sessions = await prisma.playSession.findMany({
          where: { gameId },
          include: {
            chapter: {
              select: {
                id: true,
                name: true,
                order: true
              }
            }
          },
          orderBy: { playedAt: "desc" }
        })
        return { success: true, data: transformPlaySessions(sessions) }
      } catch (error) {
        logger.error("プレイセッション取得エラー:", error)
        return { success: false, message: "プレイセッションの取得に失敗しました" }
      }
    }
  )

  ipcMain.handle(
    "create-game",
    async (_event, game: InputGameData): Promise<ApiResult<GameType>> => {
      try {
        const createdGame = await prisma.$transaction(async (tx) => {
          // ゲームを作成
          const newGame = await tx.game.create({
            data: {
              title: game.title,
              publisher: game.publisher,
              saveFolderPath: game.saveFolderPath || null,
              exePath: game.exePath,
              imagePath: game.imagePath || null
            }
          })

          // デフォルト章を作成
          const defaultChapter = await tx.chapter.create({
            data: {
              name: "デフォルト",
              gameId: newGame.id,
              order: 1
            }
          })

          // ゲームのcurrentChapterを設定
          const updatedGame = await tx.game.update({
            where: { id: newGame.id },
            data: { currentChapter: defaultChapter.id }
          })

          return updatedGame
        })
        return { success: true, data: transformGame(createdGame) }
      } catch (error) {
        logger.error("ゲーム作成エラー:", error)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { success: false, message: MESSAGES.GAME.ALREADY_EXISTS(game.title) }
        }
        return { success: false, message: MESSAGES.GAME.ADD_FAILED }
      }
    }
  )

  ipcMain.handle(
    "update-game",
    async (_event, id: string, game: InputGameData): Promise<ApiResult<GameType>> => {
      try {
        // 現在のゲームデータを取得してplayStatusの変更を確認
        const currentGame = await prisma.game.findUnique({
          where: { id }
        })

        if (!currentGame) {
          return { success: false, message: "ゲームが見つかりません" }
        }

        // 基本的な更新データを設定
        const updateData: GameUpdateData = {
          title: game.title,
          publisher: game.publisher,
          saveFolderPath: game.saveFolderPath || null,
          exePath: game.exePath,
          imagePath: game.imagePath || null,
          playStatus: game.playStatus
        }

        // playStatusが"played"に変更された場合、clearedAtを現在時刻に設定
        if (game.playStatus === "played" && currentGame.playStatus !== "played") {
          updateData.clearedAt = new Date()
        }
        // playStatusが"played"以外に変更された場合、clearedAtをnullに設定
        else if (game.playStatus !== "played" && currentGame.playStatus === "played") {
          updateData.clearedAt = null
        }

        const updatedGame = await prisma.game.update({
          where: { id },
          data: updateData
        })

        return { success: true, data: transformGame(updatedGame) }
      } catch (error) {
        logger.error("ゲーム更新エラー:", error)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { success: false, message: MESSAGES.GAME.ALREADY_EXISTS(game.title) }
        }
        return { success: false, message: MESSAGES.GAME.UPDATE_FAILED }
      }
    }
  )

  ipcMain.handle("delete-game", async (_event, gameId: string): Promise<ApiResult> => {
    try {
      await prisma.game.delete({
        where: { id: gameId }
      })
      return { success: true }
    } catch (error) {
      logger.error("ゲーム削除エラー:", error)
      return { success: false, message: MESSAGES.GAME.DELETE_FAILED }
    }
  })

  ipcMain.handle(
    "create-session",
    async (_event, duration: number, gameId: string, sessionName?: string): Promise<ApiResult> => {
      try {
        await prisma.$transaction(async (tx) => {
          // ゲーム情報を取得
          const game = await tx.game.findUnique({
            where: { id: gameId }
          })

          if (!game) {
            throw new Error("ゲームが見つかりません")
          }

          // 現在の章を取得（なければデフォルト章を作成）
          let currentChapterId = game.currentChapter
          if (!currentChapterId) {
            // デフォルト章を作成または取得
            const defaultChapterResult = await ensureDefaultChapter(gameId)
            if (!defaultChapterResult.success || !defaultChapterResult.data) {
              throw new Error("デフォルト章の作成に失敗しました")
            }
            currentChapterId = defaultChapterResult.data.id

            // ゲームのcurrentChapterを更新
            await tx.game.update({
              where: { id: gameId },
              data: { currentChapter: currentChapterId }
            })
          }

          // プレイセッションを作成（章IDとセッション名を含む）
          await tx.playSession.create({
            data: {
              duration,
              gameId,
              chapterId: currentChapterId,
              sessionName: sessionName || null
            }
          })

          // ゲームの統計情報を更新
          await tx.game.update({
            where: { id: gameId },
            data: {
              totalPlayTime: { increment: duration },
              lastPlayed: new Date()
            }
          })
        })
        return { success: true }
      } catch (error) {
        logger.error(MESSAGES.GAME.PLAY_TIME_RECORD_FAILED, error)
        return { success: false, message: MESSAGES.GAME.PLAY_TIME_RECORD_FAILED }
      }
    }
  )

  ipcMain.handle(
    "update-session-chapter",
    async (_event, sessionId: string, chapterId: string | null): Promise<ApiResult> => {
      try {
        // セッションが存在するかチェック
        const session = await prisma.playSession.findUnique({
          where: { id: sessionId }
        })

        if (!session) {
          return { success: false, message: "指定されたセッションが見つかりません" }
        }

        // chapterIdが指定されている場合、章が存在するかチェック
        if (chapterId) {
          const chapter = await prisma.chapter.findFirst({
            where: { id: chapterId, gameId: session.gameId }
          })

          if (!chapter) {
            return { success: false, message: "指定された章が見つかりません" }
          }
        }

        // セッションの章を更新
        await prisma.playSession.update({
          where: { id: sessionId },
          data: { chapterId: chapterId }
        })

        return { success: true }
      } catch (error) {
        logger.error("セッション章更新エラー:", error)
        return { success: false, message: "セッションの章更新に失敗しました" }
      }
    }
  )

  ipcMain.handle(
    "update-session-name",
    async (_event, sessionId: string, sessionName: string): Promise<ApiResult> => {
      try {
        // セッションが存在するかチェック
        const session = await prisma.playSession.findUnique({
          where: { id: sessionId }
        })

        if (!session) {
          return { success: false, message: "指定されたセッションが見つかりません" }
        }

        // セッション名を更新
        await prisma.playSession.update({
          where: { id: sessionId },
          data: { sessionName: sessionName }
        })

        return { success: true }
      } catch (error) {
        logger.error("セッション名更新エラー:", error)
        return { success: false, message: "セッション名の更新に失敗しました" }
      }
    }
  )

  ipcMain.handle("delete-play-session", async (_event, sessionId: string): Promise<ApiResult> => {
    try {
      // セッションが存在するかチェック
      const session = await prisma.playSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return { success: false, message: "指定されたセッションが見つかりません" }
      }

      // セッションを削除
      await prisma.playSession.delete({
        where: { id: sessionId }
      })

      return { success: true }
    } catch (error) {
      logger.error("セッション削除エラー:", error)
      return { success: false, message: "セッションの削除に失敗しました" }
    }
  })
}
