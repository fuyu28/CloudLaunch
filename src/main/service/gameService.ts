/**
 * @fileoverview ゲーム管理サービス
 *
 * このサービスは、ゲームエンティティに関するビジネスロジックを提供します。
 * データベース操作、バリデーション、データ変換を含む複雑な処理を担当します。
 *
 * 主な機能：
 * - ゲーム一覧の取得（検索・フィルタ・ソート）
 * - ゲームの作成・更新・削除
 * - プレイセッション管理
 * - プレイステータス管理
 */

import { type PlayStatus } from "@prisma/client"

import { gameFormSchema } from "../../schemas/game"
import {
  sessionIdSchema,
  sessionNameUpdateSchema,
  sessionChapterUpdateSchema
} from "../../schemas/playSession"
import type { InputGameData, GameType, PlaySessionType } from "../../types/game"
import type { FilterOption, SortOption, SortDirection } from "../../types/menu"
import type { ApiResult } from "../../types/result"
import { prisma } from "../db"
import { ensureDefaultChapter } from "./chapterService"
import { withErrorHandling } from "../utils/commonErrorHandlers"
import { transformGame, transformGames, transformPlaySessions } from "../utils/dataTransform"
import { logger } from "../utils/logger"
import type { Prisma } from "@prisma/client"

type GameUpdateData = {
  title: string
  publisher: string
  saveFolderPath: string | null
  exePath: string
  imagePath: string | null
  playStatus: PlayStatus
  clearedAt?: Date | null
}

/**
 * フィルタオプションからPrisma条件への変換マップ
 */
const filterMap: Record<FilterOption, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}

/**
 * ソートオプションからデータベースフィールドへの変換マップ
 */
const sortMap: Record<SortOption, string> = {
  title: "title",
  lastPlayed: "lastPlayed",
  totalPlayTime: "totalPlayTime",
  publisher: "publisher",
  lastRegistered: "createdAt"
}

/**
 * ゲーム一覧を取得します（検索・フィルタ・ソート機能付き）
 *
 * @param searchText 検索キーワード
 * @param filter フィルタオプション
 * @param sortBy ソート項目
 * @param sortDirection ソート方向
 * @returns Promise<ApiResult<GameType[]>> ゲーム一覧
 */
export async function getGames(
  searchText?: string,
  filter: FilterOption = "all",
  sortBy: SortOption = "title",
  sortDirection: SortDirection = "asc"
): Promise<ApiResult<GameType[]>> {
  return withErrorHandling(async () => {
    // 検索条件の構築
    const whereClause: Prisma.GameWhereInput = {
      ...filterMap[filter],
      ...(searchText && {
        OR: [{ title: { contains: searchText } }, { publisher: { contains: searchText } }]
      })
    }

    // ソート条件の構築
    const orderBy: Prisma.GameOrderByWithRelationInput = {
      [sortMap[sortBy]]: sortDirection
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      orderBy
    })

    return transformGames(games)
  }, "ゲーム一覧取得")
}

/**
 * 指定IDのゲーム詳細情報を取得します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<GameType | null>> ゲーム詳細情報
 */
export async function getGameById(gameId: string): Promise<ApiResult<GameType | null>> {
  return withErrorHandling(async () => {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    return game ? transformGame(game) : null
  }, "ゲーム詳細取得")
}

/**
 * 新しいゲームを作成します
 *
 * @param gameData ゲーム作成データ
 * @returns Promise<ApiResult<GameType>> 作成されたゲーム
 */
export async function createGame(gameData: InputGameData): Promise<ApiResult<GameType>> {
  return withErrorHandling(
    async () => {
      // 入力データの検証
      const validatedData = gameFormSchema.parse(gameData)

      // トランザクション内でゲーム作成とデフォルトチャプター作成を実行
      const game = await prisma.$transaction(
        async (tx) => {
          const newGame = await tx.game.create({
            data: validatedData
          })

          // デフォルトチャプターを作成
          await ensureDefaultChapter(newGame.id)

          return newGame
        },
        {
          timeout: 30000 // 30秒タイムアウト
        }
      )

      logger.info(`ゲームが作成されました: ${game.title}`)
      return transformGame(game)
    },
    "ゲーム作成",
    "ゲーム"
  )
}

/**
 * ゲーム情報を更新します
 *
 * @param gameId ゲームID
 * @param updateData 更新データ
 * @returns Promise<ApiResult<GameType>> 更新されたゲーム
 */
export async function updateGame(
  gameId: string,
  updateData: GameUpdateData
): Promise<ApiResult<GameType>> {
  return withErrorHandling(
    async () => {
      const game = await prisma.game.update({
        where: { id: gameId },
        data: updateData
      })

      logger.info(`ゲームが更新されました: ${game.title}`)
      return transformGame(game)
    },
    "ゲーム更新",
    "ゲーム"
  )
}

/**
 * ゲームを削除します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<boolean>> 削除結果
 */
export async function deleteGame(gameId: string): Promise<ApiResult<boolean>> {
  return withErrorHandling(
    async () => {
      await prisma.game.delete({
        where: { id: gameId }
      })

      logger.info(`ゲームが削除されました: ID ${gameId}`)
      return true
    },
    "ゲーム削除",
    "ゲーム"
  )
}

/**
 * プレイセッションを記録します
 *
 * @param gameId ゲームID
 * @param sessionData セッションデータ
 * @returns Promise<ApiResult<PlaySessionType>> 記録されたセッション
 */
export async function recordPlaySession(
  gameId: string,
  sessionData: { playTime: number; playedAt: Date }
): Promise<ApiResult<PlaySessionType>> {
  return withErrorHandling(
    async () => {
      const session = await prisma.$transaction(async (tx) => {
        // プレイセッションを作成
        const newSession = await tx.playSession.create({
          data: {
            gameId,
            duration: sessionData.playTime,
            playedAt: sessionData.playedAt
          }
        })

        // ゲームの統計情報を更新
        await tx.game.update({
          where: { id: gameId },
          data: {
            totalPlayTime: {
              increment: sessionData.playTime
            },
            lastPlayed: sessionData.playedAt,
            playStatus: "playing"
          }
        })

        return newSession
      })

      logger.info(
        `プレイセッションが記録されました: ゲームID ${gameId}, プレイ時間 ${sessionData.playTime}分`
      )
      return session as PlaySessionType
    },
    "プレイセッション記録",
    "プレイセッション"
  )
}

/**
 * ゲームのプレイセッション一覧を取得します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<PlaySessionType[]>> プレイセッション一覧
 */
export async function getPlaySessions(gameId: string): Promise<ApiResult<PlaySessionType[]>> {
  return withErrorHandling(async () => {
    const sessions = await prisma.playSession.findMany({
      where: { gameId },
      orderBy: { playedAt: "desc" }
    })

    return transformPlaySessions(sessions)
  }, "プレイセッション一覧取得")
}

/**
 * ゲームのプレイステータスを更新します
 *
 * @param gameId ゲームID
 * @param playStatus 新しいプレイステータス
 * @param clearedAt クリア日時（playedの場合）
 * @returns Promise<ApiResult<GameType>> 更新されたゲーム
 */
export async function updatePlayStatus(
  gameId: string,
  playStatus: PlayStatus,
  clearedAt?: Date
): Promise<ApiResult<GameType>> {
  return withErrorHandling(
    async () => {
      const updateData: { playStatus: PlayStatus; clearedAt?: Date | null } = {
        playStatus
      }

      if (playStatus === "played" && clearedAt) {
        updateData.clearedAt = clearedAt
      } else if (playStatus !== "played") {
        updateData.clearedAt = null
      }

      const game = await prisma.game.update({
        where: { id: gameId },
        data: updateData
      })

      logger.info(`プレイステータスが更新されました: ${game.title} -> ${playStatus}`)
      return transformGame(game)
    },
    "プレイステータス更新",
    "ゲーム"
  )
}

/**
 * プレイセッションの章を更新します
 *
 * @param sessionId セッションID
 * @param chapterId 章ID
 * @returns Promise<ApiResult<boolean>> 更新結果
 */
export async function updateSessionChapter(
  sessionId: string,
  chapterId: string | null
): Promise<ApiResult<boolean>> {
  return withErrorHandling(
    async () => {
      // 入力データの検証
      const validatedSessionId = sessionIdSchema.parse(sessionId)
      const validatedChapterData = sessionChapterUpdateSchema.parse({ chapterId })

      await prisma.playSession.update({
        where: { id: validatedSessionId },
        data: { chapterId: validatedChapterData.chapterId }
      })

      logger.info(`セッション章が更新されました: セッションID ${sessionId}, 章ID ${chapterId}`)
      return true
    },
    "セッション章更新",
    "プレイセッション"
  )
}

/**
 * プレイセッションの名前を更新します
 *
 * @param sessionId セッションID
 * @param sessionName セッション名
 * @returns Promise<ApiResult<boolean>> 更新結果
 */
export async function updateSessionName(
  sessionId: string,
  sessionName: string
): Promise<ApiResult<boolean>> {
  return withErrorHandling(
    async () => {
      // 入力データの検証
      const validatedSessionId = sessionIdSchema.parse(sessionId)
      const validatedNameData = sessionNameUpdateSchema.parse({ sessionName })

      await prisma.playSession.update({
        where: { id: validatedSessionId },
        data: { sessionName: validatedNameData.sessionName }
      })

      logger.info(`セッション名が更新されました: セッションID ${sessionId}, 名前 ${sessionName}`)
      return true
    },
    "セッション名更新",
    "プレイセッション"
  )
}

/**
 * プレイセッションを削除します
 *
 * @param sessionId セッションID
 * @returns Promise<ApiResult<boolean>> 削除結果
 */
export async function deletePlaySession(sessionId: string): Promise<ApiResult<boolean>> {
  return withErrorHandling(
    async () => {
      // 入力データの検証
      const validatedSessionId = sessionIdSchema.parse(sessionId)

      await prisma.playSession.delete({
        where: { id: validatedSessionId }
      })

      logger.info(`プレイセッションが削除されました: セッションID ${sessionId}`)
      return true
    },
    "プレイセッション削除",
    "プレイセッション"
  )
}
