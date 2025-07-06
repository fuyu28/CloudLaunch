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

import { Game, PlaySession } from "@prisma/client"
import { ipcMain } from "electron"
import { prisma } from "../db"
import { Prisma } from "@prisma/client"
import type { FilterOption, SortOption } from "../../types/menu"
import type { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"
import { MESSAGES } from "../../constants"

const filterMap: Record<FilterOption, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}
const sortMap: Record<SortOption, { [key: string]: "asc" | "desc" }> = {
  title: { title: "asc" },
  recentlyPlayed: { lastPlayed: "desc" },
  longestPlayed: { totalPlayTime: "desc" },
  recentlyRegistered: { createdAt: "desc" }
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle(
    "list-games",
    async (_event, searchWord: string, filter: FilterOption, sort: SortOption): Promise<Game[]> => {
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
        return games
      } catch (error) {
        logger.error("ゲーム一覧取得エラー:", error)
        return []
      }
    }
  )

  ipcMain.handle("get-game-by-id", async (_event, id: string): Promise<Game | null> => {
    try {
      return prisma.game.findFirst({
        where: { id }
      })
    } catch (error) {
      logger.error("ゲーム詳細取得エラー:", error)
      return null
    }
  })

  ipcMain.handle(
    "get-play-sessions",
    async (_event, gameId: string): Promise<ApiResult<PlaySession[]>> => {
      try {
        const sessions = await prisma.playSession.findMany({
          where: { gameId },
          orderBy: { playedAt: "desc" }
        })
        return { success: true, data: sessions }
      } catch (error) {
        logger.error("プレイセッション取得エラー:", error)
        return { success: false, message: "プレイセッションの取得に失敗しました" }
      }
    }
  )

  ipcMain.handle("create-game", async (_event, game: InputGameData): Promise<ApiResult> => {
    try {
      await prisma.game.create({
        data: {
          title: game.title,
          publisher: game.publisher,
          saveFolderPath: game.saveFolderPath ?? null,
          exePath: game.exePath,
          imagePath: game.imagePath ?? null
        }
      })
      return { success: true }
    } catch (error) {
      logger.error("ゲーム作成エラー:", error)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { success: false, message: MESSAGES.GAME.ALREADY_EXISTS(game.title) }
      }
      return { success: false, message: MESSAGES.GAME.ADD_FAILED }
    }
  })

  ipcMain.handle(
    "update-game",
    async (_event, id: string, game: InputGameData): Promise<ApiResult> => {
      try {
        await prisma.game.update({
          where: {
            id
          },
          data: {
            title: game.title,
            publisher: game.publisher,
            saveFolderPath: game.saveFolderPath,
            exePath: game.exePath,
            imagePath: game.imagePath
          }
        })
        return { success: true }
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
    async (_event, duration: number, gameId: string): Promise<ApiResult> => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.playSession.create({
            data: {
              duration,
              gameId
            }
          })

          const game = await tx.game.findUnique({
            where: { id: gameId }
          })

          if (game) {
            await tx.game.update({
              where: { id: gameId },
              data: {
                totalPlayTime: { increment: duration },
                lastPlayed: new Date()
              }
            })
          }
        })
        return { success: true }
      } catch (error) {
        logger.error(MESSAGES.GAME.PLAY_TIME_RECORD_FAILED, error)
        return { success: false, message: MESSAGES.GAME.PLAY_TIME_RECORD_FAILED }
      }
    }
  )
}
