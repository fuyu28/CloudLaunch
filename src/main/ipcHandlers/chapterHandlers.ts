/**
 * @fileoverview 章管理関連のIPCハンドラー
 *
 * 章の作成、取得、更新、削除、統計データの取得を処理します。
 * データベースとの通信を行い、章管理機能を提供します。
 */

import { ipcMain } from "electron"
import { prisma } from "../db"
import { ApiResult } from "../../types/result"
import { Chapter, ChapterStats, ChapterCreateInput, ChapterUpdateInput } from "../../types/chapter"

/**
 * ゲームの章一覧を取得
 *
 * @param gameId - ゲームID
 * @returns 章一覧
 */
export const getChapters = async (gameId: string): Promise<ApiResult<Chapter[]>> => {
  try {
    if (!gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    const chapters = await prisma.chapter.findMany({
      where: { gameId },
      orderBy: { order: "asc" }
    })

    return { success: true, data: chapters }
  } catch (error) {
    console.error("章一覧取得エラー:", error)
    return { success: false, message: "章一覧の取得に失敗しました" }
  }
}

/**
 * 章を作成
 *
 * @param input - 章作成データ
 * @returns 作成された章
 */
export const createChapter = async (input: ChapterCreateInput): Promise<ApiResult<Chapter>> => {
  try {
    if (!input.name?.trim()) {
      return { success: false, message: "章名を入力してください" }
    }

    if (!input.gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    // 最大order値を取得
    const maxOrderChapter = await prisma.chapter.findFirst({
      where: { gameId: input.gameId },
      orderBy: { order: "desc" }
    })

    const nextOrder = (maxOrderChapter?.order ?? 0) + 1

    const chapter = await prisma.chapter.create({
      data: {
        name: input.name.trim(),
        gameId: input.gameId,
        order: nextOrder
      }
    })

    return { success: true, data: chapter }
  } catch (error) {
    console.error("章作成エラー:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, message: "同じ名前の章が既に存在します" }
    }
    return { success: false, message: "章の作成に失敗しました" }
  }
}

/**
 * 章を更新
 *
 * @param chapterId - 章ID
 * @param input - 更新データ
 * @returns 更新された章
 */
export const updateChapter = async (
  chapterId: string,
  input: ChapterUpdateInput
): Promise<ApiResult<Chapter>> => {
  try {
    if (!chapterId) {
      return { success: false, message: "章IDが指定されていません" }
    }

    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    })

    if (!existingChapter) {
      return { success: false, message: "指定された章が見つかりません" }
    }

    const updateData: Partial<Chapter> = {}
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        return { success: false, message: "章名を入力してください" }
      }
      updateData.name = input.name.trim()
    }
    if (input.order !== undefined) {
      updateData.order = input.order
    }

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData
    })

    return { success: true, data: chapter }
  } catch (error) {
    console.error("章更新エラー:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, message: "同じ名前の章が既に存在します" }
    }
    return { success: false, message: "章の更新に失敗しました" }
  }
}

/**
 * 章を削除
 *
 * @param chapterId - 章ID
 * @returns 削除結果
 */
export const deleteChapter = async (chapterId: string): Promise<ApiResult<void>> => {
  try {
    if (!chapterId) {
      return { success: false, message: "章IDが指定されていません" }
    }

    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    })

    if (!existingChapter) {
      return { success: false, message: "指定された章が見つかりません" }
    }

    await prisma.chapter.delete({
      where: { id: chapterId }
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("章削除エラー:", error)
    return { success: false, message: "章の削除に失敗しました" }
  }
}

/**
 * 章の順序を更新（複数章の順序を一括更新）
 *
 * @param gameId - ゲームID
 * @param chapterOrders - 章IDと順序のペア配列
 * @returns 更新結果
 */
export const updateChapterOrders = async (
  gameId: string,
  chapterOrders: Array<{ id: string; order: number }>
): Promise<ApiResult<void>> => {
  try {
    if (!gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    if (!chapterOrders || chapterOrders.length === 0) {
      return { success: false, message: "更新する章データが指定されていません" }
    }

    // トランザクション内で順序を更新
    await prisma.$transaction(async (tx) => {
      for (const chapterOrder of chapterOrders) {
        await tx.chapter.update({
          where: {
            id: chapterOrder.id,
            gameId: gameId // 安全性のためゲームIDも条件に含める
          },
          data: { order: chapterOrder.order }
        })
      }
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("章順序更新エラー:", error)
    return { success: false, message: "章順序の更新に失敗しました" }
  }
}

/**
 * デフォルトの「デフォルト」を作成または取得
 *
 * @param gameId - ゲームID
 * @returns デフォルト章
 */
export const ensureDefaultChapter = async (gameId: string): Promise<ApiResult<Chapter>> => {
  try {
    if (!gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    // 既存の章を確認
    const existingChapters = await prisma.chapter.findMany({
      where: { gameId },
      orderBy: { order: "asc" }
    })

    // 既に章が存在する場合は最初の章を返す
    if (existingChapters.length > 0) {
      return { success: true, data: existingChapters[0] }
    }

    // デフォルト章を作成
    const defaultChapter = await prisma.chapter.create({
      data: {
        name: "デフォルト",
        gameId: gameId,
        order: 1
      }
    })

    return { success: true, data: defaultChapter }
  } catch (error) {
    console.error("デフォルト章の作成に失敗:", error)
    return { success: false, message: "デフォルト章の作成に失敗しました" }
  }
}

/**
 * ゲームの現在の章を変更
 *
 * @param gameId - ゲームID
 * @param chapterId - 新しい章ID
 * @returns 更新結果
 */
export const setCurrentChapter = async (
  gameId: string,
  chapterId: string
): Promise<ApiResult<void>> => {
  try {
    if (!gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    if (!chapterId) {
      return { success: false, message: "章IDが指定されていません" }
    }

    // 章が存在することを確認
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, gameId: gameId }
    })

    if (!chapter) {
      return { success: false, message: "指定された章が見つかりません" }
    }

    // ゲームの現在の章を更新
    await prisma.game.update({
      where: { id: gameId },
      data: { currentChapter: chapterId }
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("現在の章の変更に失敗:", error)
    return { success: false, message: "現在の章の変更に失敗しました" }
  }
}

/**
 * 章別統計データを取得
 *
 * @param gameId - ゲームID
 * @returns 章別統計データ
 */
export const getChapterStats = async (gameId: string): Promise<ApiResult<ChapterStats[]>> => {
  try {
    if (!gameId) {
      return { success: false, message: "ゲームIDが指定されていません" }
    }

    // 章とプレイセッションを結合して統計を取得
    const chapters = await prisma.chapter.findMany({
      where: { gameId },
      include: {
        playSessions: {
          select: {
            duration: true
          }
        }
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

    return { success: true, data: chapterStats }
  } catch (error) {
    console.error("章別統計取得エラー:", error)
    return { success: false, message: "章別統計の取得に失敗しました" }
  }
}

/**
 * 章管理関連のIPCハンドラーを登録
 */
export const registerChapterHandlers = (): void => {
  ipcMain.handle("chapter:getChapters", async (_, gameId: string) => {
    return await getChapters(gameId)
  })

  ipcMain.handle("chapter:createChapter", async (_, input: ChapterCreateInput) => {
    return await createChapter(input)
  })

  ipcMain.handle(
    "chapter:updateChapter",
    async (_, chapterId: string, input: ChapterUpdateInput) => {
      return await updateChapter(chapterId, input)
    }
  )

  ipcMain.handle("chapter:deleteChapter", async (_, chapterId: string) => {
    return await deleteChapter(chapterId)
  })

  ipcMain.handle(
    "chapter:updateChapterOrders",
    async (_, gameId: string, chapterOrders: Array<{ id: string; order: number }>) => {
      return await updateChapterOrders(gameId, chapterOrders)
    }
  )

  ipcMain.handle("chapter:getChapterStats", async (_, gameId: string) => {
    return await getChapterStats(gameId)
  })

  ipcMain.handle("chapter:ensureDefaultChapter", async (_, gameId: string) => {
    return await ensureDefaultChapter(gameId)
  })

  ipcMain.handle("chapter:setCurrentChapter", async (_, gameId: string, chapterId: string) => {
    return await setCurrentChapter(gameId, chapterId)
  })
}
