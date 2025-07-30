/**
 * @fileoverview メモ管理IPCハンドラー
 *
 * このファイルは、フロントエンドからのメモ操作リクエストを受け取り、
 * メモサービスに処理を委譲するIPCハンドラーを提供します。
 *
 * 責務：
 * - IPC通信の受信と基本的な入力検証
 * - サービス層への処理委譲
 * - レスポンスの形式変換
 */

import { ipcMain } from "electron"

import type {
  MemoType,
  CreateMemoData,
  UpdateMemoData,
  CloudMemoInfo,
  MemoSyncResult
} from "../../types/memo"
import type { ApiResult } from "../../types/result"
import {
  getCloudMemos,
  downloadMemoFromCloud,
  uploadMemoToCloud
} from "../service/cloudMemoService"
import * as memoService from "../service/memoService"
import { syncMemos } from "../service/memoSyncService"
import { withValidatedCloudStorage } from "../utils/cloudStorageHelper"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { logger } from "../utils/logger"
import { memoFileManager } from "../utils/memoFileManager"

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
      return await memoService.getMemosByGameId(gameId)
    }
  )

  /**
   * 指定されたIDのメモを取得します
   */
  ipcMain.handle(
    "memo:getMemoById",
    async (_, memoId: string): Promise<ApiResult<MemoType | null>> => {
      return await memoService.getMemoById(memoId)
    }
  )

  /**
   * 新しいメモを作成します
   */
  ipcMain.handle(
    "memo:createMemo",
    async (_, memoData: CreateMemoData): Promise<ApiResult<MemoType>> => {
      return await memoService.createMemo(memoData)
    }
  )

  /**
   * メモを更新します
   */
  ipcMain.handle(
    "memo:updateMemo",
    async (_, memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>> => {
      return await memoService.updateMemo(memoId, updateData)
    }
  )

  /**
   * メモを削除します
   */
  ipcMain.handle("memo:deleteMemo", async (_, memoId: string): Promise<ApiResult<boolean>> => {
    return await memoService.deleteMemo(memoId)
  })

  /**
   * メモファイルのパスを取得します（エクスプローラーで開く用）
   */
  ipcMain.handle("memo:getMemoFilePath", async (_, memoId: string): Promise<ApiResult<string>> => {
    return await memoService.getMemoFilePath(memoId)
  })

  /**
   * ゲームのメモディレクトリパスを取得します
   */
  ipcMain.handle("memo:getGameMemoDir", async (_, gameId: string): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoService.getGameMemoDir(gameId)
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
    return await memoService.getAllMemos()
  })

  /**
   * メモルートディレクトリパスを取得します
   */
  ipcMain.handle("memo:getMemoRootDir", async (): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoService.getMemoRootDir()
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
        return withValidatedCloudStorage(async (credentials, s3Client) => {
          // メモ情報を取得
          const memoResult = await memoService.getMemoById(memoId)
          if (!memoResult.success || !memoResult.data) {
            return { success: false, message: "メモが見つかりません" }
          }

          // ゲーム情報も含めて取得
          const { prisma } = await import("../db")
          const memoWithGame = await prisma.memo.findUnique({
            where: { id: memoId },
            include: {
              game: {
                select: {
                  title: true
                }
              }
            }
          })

          if (!memoWithGame) {
            return { success: false, message: "メモが見つかりません" }
          }

          await uploadMemoToCloud(s3Client, credentials.bucketName, memoWithGame)

          return { success: true, data: true }
        })
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

        const { credentials, s3Client } = validationResult.data!

        const content = await downloadMemoFromCloud(
          s3Client,
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

      const { credentials, s3Client } = validationResult.data!

      const cloudMemos = await getCloudMemos(s3Client, credentials.bucketName)

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

        const { credentials, s3Client } = validationResult.data!

        // クラウドメモ一覧を取得
        const allCloudMemos = await getCloudMemos(s3Client, credentials.bucketName)

        // 特定のゲームのみ同期する場合はフィルタリング
        let cloudMemos = allCloudMemos
        if (gameId) {
          const { prisma } = await import("../db")
          const game = await prisma.game.findUnique({ where: { id: gameId } })
          if (!game) {
            return { success: false, message: "指定されたゲームが見つかりません" }
          }
          const sanitizedGameTitle = game.title.replace(/[<>:"/\\|?*]/g, "_")
          cloudMemos = cloudMemos.filter((memo) => memo.gameTitle === sanitizedGameTitle)
        }

        // 同期実行
        const syncResult = await syncMemos(s3Client, credentials.bucketName, cloudMemos, gameId)

        return { success: true, data: syncResult }
      } catch (error) {
        logger.error("メモ同期エラー:", error)
        return { success: false, message: "メモの同期に失敗しました" }
      }
    }
  )
}
