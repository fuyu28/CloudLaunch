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
      try {
        // ゲームの存在確認
        const game = await prisma.game.findUnique({
          where: { id: memoData.gameId }
        })

        if (!game) {
          return { success: false, message: "指定されたゲームが見つかりません" }
        }

        const memo = await prisma.memo.create({
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
          logger.warn("メモファイル作成エラー (データベース作成は成功):", fileResult.error)
        }

        logger.info(`メモを作成しました: ${memo.title}`)
        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ作成エラー:", error)
        return { success: false, message: "メモの作成に失敗しました" }
      }
    }
  )

  /**
   * メモを更新します
   */
  ipcMain.handle(
    "memo:updateMemo",
    async (_, memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>> => {
      try {
        // 更新前のメモ情報を取得
        const oldMemo = await prisma.memo.findUnique({
          where: { id: memoId }
        })

        if (!oldMemo) {
          return { success: false, message: "メモが見つかりません" }
        }

        const memo = await prisma.memo.update({
          where: { id: memoId },
          data: updateData
        })

        // メモファイルを更新
        const fileResult = await memoFileManager.updateMemoFile(
          memo.gameId,
          memo.id,
          oldMemo.title,
          memo.title,
          memo.content
        )
        if (!fileResult.success) {
          logger.warn("メモファイル更新エラー (データベース更新は成功):", fileResult.error)
        }

        logger.info(`メモを更新しました: ${memo.title}`)
        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ更新エラー:", error)
        return { success: false, message: "メモの更新に失敗しました" }
      }
    }
  )

  /**
   * メモを削除します
   */
  ipcMain.handle("memo:deleteMemo", async (_, memoId: string): Promise<ApiResult<boolean>> => {
    try {
      // 削除前のメモ情報を取得
      const memo = await prisma.memo.findUnique({
        where: { id: memoId }
      })

      if (!memo) {
        return { success: false, message: "メモが見つかりません" }
      }

      await prisma.memo.delete({
        where: { id: memoId }
      })

      // メモファイルを削除
      const fileResult = await memoFileManager.deleteMemoFile(memo.gameId, memo.id, memo.title)
      if (!fileResult.success) {
        logger.warn("メモファイル削除エラー (データベース削除は成功):", fileResult.error)
      }

      logger.info(`メモを削除しました: ${memoId}`)
      return { success: true, data: true }
    } catch (error) {
      logger.error("メモ削除エラー:", error)
      return { success: false, message: "メモの削除に失敗しました" }
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
