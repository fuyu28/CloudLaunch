/**
 * @fileoverview メモ管理に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのメモ操作リクエストを処理します。
 * - ゲームに関連するメモ一覧の取得
 * - メモの詳細情報の取得
 * - メモの作成・更新・削除
 * - クラウド同期機能
 *
 * すべての操作はPrismaを通してSQLiteデータベースに対して実行されます。
 * メモはゲームと1対多の関係で、特定のゲームに紐づく形で管理されます。
 */

import { ipcMain } from "electron"
import { prisma } from "../db"
import type { ApiResult } from "../../types/result"
import type {
  MemoType,
  CreateMemoData,
  UpdateMemoData,
  CloudMemoInfo,
  MemoSyncResult
} from "../../types/memo"
import { logger } from "../utils/logger"
import { memoFileManager } from "../utils/memoFileManager"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { syncMemos } from "../service/memoSyncService"
import {
  getCloudMemos,
  downloadMemoFromCloud,
  uploadMemoToCloud
} from "../service/cloudMemoService"

export function registerMemoHandlers(): void {
  // メモファイルマネージャーの初期化
  memoFileManager.initializeBaseDir().catch((error) => {
    logger.error("メモファイルマネージャー初期化エラー:", error)
  })

  registerBasicMemoHandlers()
  registerCloudMemoHandlers()
}

/**
 * 基本的なメモ操作ハンドラーを登録します
 */
function registerBasicMemoHandlers(): void {
  /**
   * 指定されたゲームのメモ一覧を取得します
   */
  ipcMain.handle(
    "memo:getMemosByGameId",
    async (_, gameId: string): Promise<ApiResult<MemoType[]>> => {
      try {
        const memos = await prisma.memo.findMany({
          where: { gameId },
          orderBy: { updatedAt: "desc" }
        })

        return { success: true, data: memos }
      } catch (error) {
        logger.error("メモ一覧取得エラー:", error)
        return { success: false, message: "メモ一覧の取得に失敗しました" }
      }
    }
  )

  /**
   * 指定されたIDのメモを取得します
   */
  ipcMain.handle(
    "memo:getMemoById",
    async (_, memoId: string): Promise<ApiResult<MemoType | null>> => {
      try {
        const memo = await prisma.memo.findUnique({
          where: { id: memoId }
        })

        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ取得エラー:", error)
        return { success: false, message: "メモの取得に失敗しました" }
      }
    }
  )

  /**
   * 新しいメモを作成します
   */
  ipcMain.handle(
    "memo:createMemo",
    async (_, memoData: CreateMemoData): Promise<ApiResult<MemoType>> => {
      let createdMemo: MemoType | null = null

      try {
        // ゲームの存在確認
        const game = await prisma.game.findUnique({
          where: { id: memoData.gameId }
        })

        if (!game) {
          return { success: false, message: "指定されたゲームが見つかりません" }
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
            await memoFileManager.deleteMemoFile(
              createdMemo.gameId,
              createdMemo.id,
              createdMemo.title
            )
          } catch (cleanupError) {
            logger.error("メモファイルクリーンアップエラー:", cleanupError)
          }
        }

        const errorMessage = error instanceof Error ? error.message : "メモの作成に失敗しました"
        return { success: false, message: errorMessage }
      }
    }
  )

  /**
   * メモを更新します
   */
  ipcMain.handle(
    "memo:updateMemo",
    async (_, memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>> => {
      let updatedMemo: MemoType | null = null
      let oldMemo: MemoType | null = null

      try {
        // 更新前のメモ情報を取得
        oldMemo = await prisma.memo.findUnique({
          where: { id: memoId }
        })

        if (!oldMemo) {
          return { success: false, message: "メモが見つかりません" }
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
  )

  /**
   * メモを削除します
   */
  ipcMain.handle("memo:deleteMemo", async (_, memoId: string): Promise<ApiResult<boolean>> => {
    let deletedMemo: MemoType | null = null

    try {
      // 削除前のメモ情報を取得
      deletedMemo = await prisma.memo.findUnique({
        where: { id: memoId }
      })

      if (!deletedMemo) {
        return { success: false, message: "メモが見つかりません" }
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
  })

  /**
   * メモファイルのパスを取得します（エクスプローラーで開く用）
   */
  ipcMain.handle("memo:getMemoFilePath", async (_, memoId: string): Promise<ApiResult<string>> => {
    try {
      const memo = await prisma.memo.findUnique({
        where: { id: memoId }
      })

      if (!memo) {
        return { success: false, message: "メモが見つかりません" }
      }

      const filePath = memoFileManager.getMemoFilePathForReading(memo.gameId, memo.id, memo.title)

      return { success: true, data: filePath }
    } catch (error) {
      logger.error("メモファイルパス取得エラー:", error)
      return { success: false, message: "メモファイルパスの取得に失敗しました" }
    }
  })

  /**
   * ゲームのメモディレクトリパスを取得します
   */
  ipcMain.handle("memo:getGameMemoDir", async (_, gameId: string): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoFileManager.getGameMemoDirPath(gameId)
      return { success: true, data: dirPath }
    } catch (error) {
      logger.error("ゲームメモディレクトリパス取得エラー:", error)
      return { success: false, message: "ディレクトリパスの取得に失敗しました" }
    }
  })

  /**
   * すべてのメモ一覧を取得します（ゲーム名付き）
   */
  ipcMain.handle("memo:getAllMemos", async (): Promise<ApiResult<MemoType[]>> => {
    try {
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

      return { success: true, data: memosWithGameTitle }
    } catch (error) {
      logger.error("全メモ一覧取得エラー:", error)
      return { success: false, message: "メモ一覧の取得に失敗しました" }
    }
  })

  /**
   * メモルートディレクトリパスを取得します
   */
  ipcMain.handle("memo:getMemoRootDir", async (): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoFileManager.getBaseDir()
      return { success: true, data: dirPath }
    } catch (error) {
      logger.error("メモルートディレクトリパス取得エラー:", error)
      return { success: false, message: "ディレクトリパスの取得に失敗しました" }
    }
  })
}

/**
 * クラウドメモ操作ハンドラーを登録します
 */
function registerCloudMemoHandlers(): void {
  /**
   * メモをクラウドストレージに保存します
   */
  ipcMain.handle(
    "memo:uploadMemoToCloud",
    async (_, memoId: string): Promise<ApiResult<boolean>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // メモ情報を取得
        const memo = await prisma.memo.findUnique({
          where: { id: memoId },
          include: {
            game: {
              select: {
                title: true
              }
            }
          }
        })

        if (!memo) {
          return { success: false, message: "メモが見つかりません" }
        }

        await uploadMemoToCloud(r2Client, credentials.bucketName, memo)

        return { success: true, data: true }
      } catch (error) {
        logger.error("メモクラウド保存エラー:", error)
        return { success: false, message: "メモのクラウド保存に失敗しました" }
      }
    }
  )

  /**
   * クラウドストレージからメモをダウンロードします
   */
  ipcMain.handle(
    "memo:downloadMemoFromCloud",
    async (_, gameTitle: string, memoFileName: string): Promise<ApiResult<string>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        const content = await downloadMemoFromCloud(
          r2Client,
          credentials.bucketName,
          gameTitle,
          memoFileName
        )

        return { success: true, data: content }
      } catch (error) {
        logger.error("メモクラウドダウンロードエラー:", error)
        return { success: false, message: "メモのクラウドダウンロードに失敗しました" }
      }
    }
  )

  /**
   * クラウドストレージからメモ一覧を取得します
   */
  ipcMain.handle("memo:getCloudMemos", async (): Promise<ApiResult<CloudMemoInfo[]>> => {
    try {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      const cloudMemos = await getCloudMemos(r2Client, credentials.bucketName)

      return { success: true, data: cloudMemos }
    } catch (error) {
      logger.error("クラウドメモ一覧取得エラー:", error)
      return { success: false, message: "クラウドメモ一覧の取得に失敗しました" }
    }
  })

  /**
   * クラウドストレージからメモを同期します
   */
  ipcMain.handle(
    "memo:syncMemosFromCloud",
    async (_, gameId?: string): Promise<ApiResult<MemoSyncResult>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // クラウドメモ一覧を取得
        const allCloudMemos = await getCloudMemos(r2Client, credentials.bucketName)

        // 特定のゲームのみ同期する場合はフィルタリング
        let cloudMemos = allCloudMemos
        if (gameId) {
          const game = await prisma.game.findUnique({ where: { id: gameId } })
          if (!game) {
            return { success: false, message: "指定されたゲームが見つかりません" }
          }
          const sanitizedGameTitle = game.title.replace(/[<>:"/\\|?*]/g, "_")
          cloudMemos = cloudMemos.filter((memo) => memo.gameTitle === sanitizedGameTitle)
        }

        // 同期実行
        const syncResult = await syncMemos(r2Client, credentials.bucketName, cloudMemos, gameId)

        return { success: true, data: syncResult }
      } catch (error) {
        logger.error("メモ同期エラー:", error)
        return { success: false, message: "メモの同期に失敗しました" }
      }
    }
  )
}
