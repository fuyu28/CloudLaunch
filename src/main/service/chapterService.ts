/**
 * @fileoverview 章管理サービス
 *
 * このサービスは、章エンティティに関するビジネスロジックを提供します。
 * データベース操作、バリデーション、統計情報計算などの複雑な処理を担当します。
 *
 * 主な機能：
 * - 章の作成・更新・削除
 * - 章一覧の取得（ソート付き）
 * - 章統計データの取得
 * - 章順序の更新
 * - デフォルト章の作成
 * - 現在章の設定
 */

import { chapterCreateSchema, chapterUpdateSchema, chapterIdSchema } from "../../schemas/chapter"
import type {
  Chapter,
  ChapterStats,
  ChapterCreateInput,
  ChapterUpdateInput
} from "../../types/chapter"
import type { ApiResult } from "../../types/result"
import { prisma } from "../db"
import { withErrorHandling } from "../utils/commonErrorHandlers"
import { logger } from "../utils/logger"

/**
 * ゲームの章一覧を取得します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<Chapter[]>> 章一覧
 */
export async function getChapters(gameId: string): Promise<ApiResult<Chapter[]>> {
  return withErrorHandling(async () => {
    // ZodスキーマでゲームIDを検証
    const validatedGameId = chapterIdSchema.parse(gameId)

    if (!validatedGameId) {
      throw new Error("ゲームIDが指定されていません")
    }

    const chapters = await prisma.chapter.findMany({
      where: { gameId: validatedGameId },
      orderBy: { order: "asc" }
    })

    return chapters
  }, "章一覧取得")
}

/**
 * 新しい章を作成します
 *
 * @param input 章作成データ
 * @returns Promise<ApiResult<Chapter>> 作成された章
 */
export async function createChapter(input: ChapterCreateInput): Promise<ApiResult<Chapter>> {
  return withErrorHandling(async () => {
    // 入力データの検証
    const validatedInput = chapterCreateSchema.parse(input)

    // 同じゲーム内での最大順序を取得
    const maxOrder = await prisma.chapter.aggregate({
      where: { gameId: validatedInput.gameId },
      _max: { order: true }
    })

    const newOrder = (maxOrder._max.order ?? 0) + 1

    const chapter = await prisma.chapter.create({
      data: {
        ...validatedInput,
        order: newOrder
      }
    })

    logger.info(`章が作成されました: ${chapter.name} (ID: ${chapter.id})`)
    return chapter
  }, "章作成")
}

/**
 * 章を更新します
 *
 * @param chapterId 章ID
 * @param input 更新データ
 * @returns Promise<ApiResult<Chapter>> 更新された章
 */
export async function updateChapter(
  chapterId: string,
  input: ChapterUpdateInput
): Promise<ApiResult<Chapter>> {
  return withErrorHandling(async () => {
    // 入力データの検証
    const validatedChapterId = chapterIdSchema.parse(chapterId)
    const validatedInput = chapterUpdateSchema.parse(input)

    const chapter = await prisma.chapter.update({
      where: { id: validatedChapterId },
      data: validatedInput
    })

    logger.info(`章が更新されました: ${chapter.name} (ID: ${chapter.id})`)
    return chapter
  }, "章更新")
}

/**
 * 章を削除します
 *
 * @param chapterId 章ID
 * @returns Promise<ApiResult<boolean>> 削除結果
 */
export async function deleteChapter(chapterId: string): Promise<ApiResult<boolean>> {
  return withErrorHandling(async () => {
    const validatedChapterId = chapterIdSchema.parse(chapterId)

    await prisma.chapter.delete({
      where: { id: validatedChapterId }
    })

    logger.info(`章が削除されました: ID ${validatedChapterId}`)
    return true
  }, "章削除")
}

/**
 * 章の順序を更新します
 *
 * @param gameId ゲームID
 * @param chapterOrders 章順序データ
 * @returns Promise<ApiResult<boolean>> 更新結果
 */
export async function updateChapterOrders(
  gameId: string,
  chapterOrders: Array<{ id: string; order: number }>
): Promise<ApiResult<boolean>> {
  return withErrorHandling(async () => {
    const validatedGameId = chapterIdSchema.parse(gameId)

    // トランザクション内で順序を更新
    await prisma.$transaction(async (tx) => {
      for (const { id, order } of chapterOrders) {
        await tx.chapter.update({
          where: { id, gameId: validatedGameId },
          data: { order }
        })
      }
    })

    logger.info(`章順序が更新されました: ゲームID ${validatedGameId}`)
    return true
  }, "章順序更新")
}

/**
 * 章統計データを取得します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<ChapterStats>> 章統計データ
 */
export async function getChapterStats(gameId: string): Promise<ApiResult<ChapterStats[]>> {
  return withErrorHandling(async () => {
    const validatedGameId = chapterIdSchema.parse(gameId)

    const chapters = await prisma.chapter.findMany({
      where: { gameId: validatedGameId },
      include: {
        playSessions: true
      },
      orderBy: { order: "asc" }
    })

    const chapterStats: ChapterStats[] = chapters.map((chapter) => {
      const totalTime = chapter.playSessions.reduce((sum, session) => sum + session.duration, 0)
      const sessionCount = chapter.playSessions.length
      const averageTime = sessionCount > 0 ? totalTime / sessionCount : 0

      return {
        chapterId: chapter.id,
        chapterName: chapter.name,
        totalTime,
        sessionCount,
        averageTime,
        order: chapter.order
      }
    })

    return chapterStats
  }, "章統計取得")
}

/**
 * デフォルト章を作成します（存在しない場合）
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<Chapter>> デフォルト章
 */
export async function ensureDefaultChapter(gameId: string): Promise<ApiResult<Chapter>> {
  return withErrorHandling(async () => {
    const validatedGameId = chapterIdSchema.parse(gameId)

    // 既存の章をチェック
    const existingChapter = await prisma.chapter.findFirst({
      where: { gameId: validatedGameId }
    })

    if (existingChapter) {
      return existingChapter
    }

    // デフォルト章を作成
    const defaultChapter = await prisma.chapter.create({
      data: {
        gameId: validatedGameId,
        name: "第1章",
        order: 1
      }
    })

    logger.info(`デフォルト章が作成されました: ${defaultChapter.name} (ID: ${defaultChapter.id})`)
    return defaultChapter
  }, "デフォルト章作成")
}

/**
 * 現在の章を設定します
 *
 * @param gameId ゲームID
 * @param chapterId 章ID
 * @returns Promise<ApiResult<boolean>> 設定結果
 */
export async function setCurrentChapter(
  gameId: string,
  chapterId: string
): Promise<ApiResult<boolean>> {
  return withErrorHandling(async () => {
    const validatedGameId = chapterIdSchema.parse(gameId)
    const validatedChapterId = chapterIdSchema.parse(chapterId)

    // 章の存在確認
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: validatedChapterId,
        gameId: validatedGameId
      }
    })

    if (!chapter) {
      throw new Error("指定された章が見つかりません")
    }

    // ゲームの現在章を更新
    await prisma.game.update({
      where: { id: validatedGameId },
      data: { currentChapter: validatedChapterId }
    })

    logger.info(`現在章が設定されました: ゲームID ${validatedGameId}, 章ID ${validatedChapterId}`)
    return true
  }, "現在章設定")
}
