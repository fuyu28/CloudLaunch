/**
 * @fileoverview メモ管理サービス
 *
 * このサービスは、メモエンティティに関するビジネスロジックを提供します。
 * データベース操作、ファイル操作、クラウド同期などの複雑な処理を担当します。
 *
 * 主な機能：
 * - メモの作成・更新・削除（データベース + ファイル）
 * - メモ一覧取得
 * - ファイルパス管理
 * - 原子性を保った操作（データベースとファイルの整合性）
 */

import type { MemoType, CreateMemoData, UpdateMemoData } from "../../types/memo"
import type { ApiResult } from "../../types/result"
import { prisma } from "../db"
import { withErrorHandling, handleEntityNotFoundError } from "../utils/commonErrorHandlers"
import { logger } from "../utils/logger"
import { memoFileManager } from "../utils/memoFileManager"

/**
 * 指定されたゲームのメモ一覧を取得します
 *
 * @param gameId ゲームID
 * @returns Promise<ApiResult<MemoType[]>> メモ一覧
 */
export async function getMemosByGameId(gameId: string): Promise<ApiResult<MemoType[]>> {
  return withErrorHandling(async () => {
    const memos = await prisma.memo.findMany({
      where: { gameId },
      orderBy: { updatedAt: "desc" }
    })

    return memos
  }, "メモ一覧取得")
}

/**
 * 指定されたIDのメモを取得します
 *
 * @param memoId メモID
 * @returns Promise<ApiResult<MemoType | null>> メモ詳細
 */
export async function getMemoById(memoId: string): Promise<ApiResult<MemoType | null>> {
  return withErrorHandling(async () => {
    const memo = await prisma.memo.findUnique({
      where: { id: memoId }
    })

    return memo
  }, "メモ取得")
}

/**
 * 新しいメモを作成します（データベース + ファイル）
 *
 * @param memoData メモ作成データ
 * @returns Promise<ApiResult<MemoType>> 作成されたメモ
 */
export async function createMemo(memoData: CreateMemoData): Promise<ApiResult<MemoType>> {
  let createdMemo: MemoType | null = null

  try {
    // ゲームの存在確認
    const game = await prisma.game.findUnique({
      where: { id: memoData.gameId }
    })

    if (!game) {
      return handleEntityNotFoundError("ゲーム", memoData.gameId) as ApiResult<MemoType>
    }

    // データベースとファイルの両方を原子的に作成
    createdMemo = await prisma.$transaction(async (tx) => {
      // データベースにメモを作成
      const memo = await tx.memo.create({
        data: memoData
      })

      // メモファイルを作成
      const fileResult = await memoFileManager.createMemoFile(
        memo.gameId,
        memo.id,
        memo.title,
        memo.content
      )

      if (!fileResult.success) {
        // ファイル作成に失敗した場合、トランザクションを失敗させる
        throw new Error(`メモファイル作成エラー: ${fileResult.error}`)
      }

      return memo
    })

    if (!createdMemo) {
      throw new Error("メモの作成に失敗しました")
    }

    logger.info(`メモを作成しました: ${createdMemo.title}`)
    return { success: true, data: createdMemo }
  } catch (error) {
    logger.error("メモ作成エラー:", error)

    // エラー時のクリーンアップ（ファイルが作成されている場合は削除）
    if (createdMemo) {
      try {
        await memoFileManager.deleteMemoFile(createdMemo.gameId, createdMemo.id, createdMemo.title)
      } catch (cleanupError) {
        logger.error("メモファイルクリーンアップエラー:", cleanupError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : "メモの作成に失敗しました"
    return { success: false, message: errorMessage }
  }
}

/**
 * メモを更新します（データベース + ファイル）
 *
 * @param memoId メモID
 * @param updateData 更新データ
 * @returns Promise<ApiResult<MemoType>> 更新されたメモ
 */
export async function updateMemo(
  memoId: string,
  updateData: UpdateMemoData
): Promise<ApiResult<MemoType>> {
  let updatedMemo: MemoType | null = null
  let oldMemo: MemoType | null = null

  try {
    // 更新前のメモ情報を取得
    oldMemo = await prisma.memo.findUnique({
      where: { id: memoId }
    })

    if (!oldMemo) {
      return handleEntityNotFoundError("メモ", memoId) as ApiResult<MemoType>
    }

    // データベースとファイルの両方を原子的に更新
    updatedMemo = await prisma.$transaction(async (tx) => {
      // データベースのメモを更新
      const memo = await tx.memo.update({
        where: { id: memoId },
        data: updateData
      })

      // メモファイルを更新
      const fileResult = await memoFileManager.updateMemoFile(
        memo.gameId,
        memo.id,
        oldMemo!.title,
        memo.title,
        memo.content
      )

      if (!fileResult.success) {
        // ファイル更新に失敗した場合、トランザクションを失敗させる
        throw new Error(`メモファイル更新エラー: ${fileResult.error}`)
      }

      return memo
    })

    if (!updatedMemo) {
      throw new Error("メモの更新に失敗しました")
    }

    logger.info(`メモを更新しました: ${updatedMemo.title}`)
    return { success: true, data: updatedMemo }
  } catch (error) {
    logger.error("メモ更新エラー:", error)

    // エラー時のロールバック（古いファイルに戻す）
    if (oldMemo && updatedMemo) {
      try {
        await memoFileManager.updateMemoFile(
          oldMemo.gameId,
          oldMemo.id,
          updatedMemo.title,
          oldMemo.title,
          oldMemo.content
        )
      } catch (rollbackError) {
        logger.error("メモファイルロールバックエラー:", rollbackError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : "メモの更新に失敗しました"
    return { success: false, message: errorMessage }
  }
}

/**
 * メモを削除します（データベース + ファイル）
 *
 * @param memoId メモID
 * @returns Promise<ApiResult<boolean>> 削除結果
 */
export async function deleteMemo(memoId: string): Promise<ApiResult<boolean>> {
  let deletedMemo: MemoType | null = null

  try {
    // 削除前のメモ情報を取得
    deletedMemo = await prisma.memo.findUnique({
      where: { id: memoId }
    })

    if (!deletedMemo) {
      return handleEntityNotFoundError("メモ", memoId) as ApiResult<boolean>
    }

    // データベースとファイルの両方を原子的に削除
    await prisma.$transaction(async (tx) => {
      // データベースからメモを削除
      await tx.memo.delete({
        where: { id: memoId }
      })

      // メモファイルを削除
      const fileResult = await memoFileManager.deleteMemoFile(
        deletedMemo!.gameId,
        deletedMemo!.id,
        deletedMemo!.title
      )

      if (!fileResult.success) {
        // ファイル削除に失敗した場合、トランザクションを失敗させる
        throw new Error(`メモファイル削除エラー: ${fileResult.error}`)
      }
    })

    logger.info(`メモを削除しました: ${deletedMemo.title} (ID: ${memoId})`)
    return { success: true, data: true }
  } catch (error) {
    logger.error("メモ削除エラー:", error)

    // エラー時のロールバック（メモを再作成）
    if (deletedMemo) {
      try {
        await prisma.memo.create({
          data: {
            id: deletedMemo.id,
            title: deletedMemo.title,
            content: deletedMemo.content,
            gameId: deletedMemo.gameId,
            createdAt: deletedMemo.createdAt,
            updatedAt: deletedMemo.updatedAt
          }
        })
        await memoFileManager.createMemoFile(
          deletedMemo.gameId,
          deletedMemo.id,
          deletedMemo.title,
          deletedMemo.content
        )
      } catch (rollbackError) {
        logger.error("メモ削除ロールバックエラー:", rollbackError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : "メモの削除に失敗しました"
    return { success: false, message: errorMessage }
  }
}

/**
 * すべてのメモ一覧を取得します（ゲーム名付き）
 *
 * @returns Promise<ApiResult<MemoType[]>> 全メモ一覧
 */
export async function getAllMemos(): Promise<ApiResult<MemoType[]>> {
  return withErrorHandling(async () => {
    const memos = await prisma.memo.findMany({
      include: {
        game: {
          select: {
            title: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    const memosWithGameTitle = memos.map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      gameId: memo.gameId,
      gameTitle: memo.game.title,
      createdAt: memo.createdAt,
      updatedAt: memo.updatedAt
    }))

    return memosWithGameTitle
  }, "全メモ一覧取得")
}

/**
 * メモファイルのパスを取得します
 *
 * @param memoId メモID
 * @returns Promise<ApiResult<string>> ファイルパス
 */
export async function getMemoFilePath(memoId: string): Promise<ApiResult<string>> {
  try {
    const memo = await prisma.memo.findUnique({
      where: { id: memoId }
    })

    if (!memo) {
      return handleEntityNotFoundError("メモ", memoId) as ApiResult<string>
    }

    const filePath = memoFileManager.getMemoFilePathForReading(memo.gameId, memo.id, memo.title)
    return { success: true, data: filePath }
  } catch (error) {
    return withErrorHandling(async () => {
      throw error
    }, "メモファイルパス取得")
  }
}

/**
 * ゲームのメモディレクトリパスを取得します
 *
 * @param gameId ゲームID
 * @returns string ディレクトリパス
 */
export function getGameMemoDir(gameId: string): string {
  return memoFileManager.getGameMemoDirPath(gameId)
}

/**
 * メモルートディレクトリパスを取得します
 *
 * @returns string ルートディレクトリパス
 */
export function getMemoRootDir(): string {
  return memoFileManager.getBaseDir()
}
