/**
 * @fileoverview セーブデータのクラウドダウンロード機能
 *
 * このハンドラーは、フロントエンドからのダウンロード関連リクエストを受け取り、
 * ダウンロードサービスに処理を委譲するIPCハンドラーを提供します。
 *
 * 責務：
 * - IPC通信の受信と基本的な入力検証
 * - 認証情報の検証
 * - サービス層への処理委譲
 * - レスポンスの形式変換
 */

import { ipcMain } from "electron"

import type { ApiResult } from "../../types/result"
import { downloadSaveData, getCloudDataInfo, getCloudFileDetails } from "../service/downloadService"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"

export function registerDownloadSaveDataHandler(): void {
  /**
   * セーブデータ一括ダウンロードAPI
   */
  ipcMain.handle(
    "cloud:downloadSaveData",
    withFileOperationErrorHandling(
      async (_event, localPath: string, remotePath: string): Promise<ApiResult<boolean>> => {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, s3Client } = validationResult.data!

        // サービス層に処理を委譲
        const result = await downloadSaveData(
          s3Client,
          credentials.bucketName,
          localPath,
          remotePath
        )

        return result
      }
    )
  )

  /**
   * クラウドデータ情報取得ハンドラー
   */
  ipcMain.handle(
    "cloud:getDataInfo",
    withFileOperationErrorHandling(
      async (
        _event,
        gameId: string
      ): Promise<
        ApiResult<{ exists: boolean; uploadedAt?: Date; size?: number; comment?: string }>
      > => {
        const credentialResult = await validateCredentialsForR2()
        if (!credentialResult.success) {
          return { success: false, message: credentialResult.message }
        }

        const { credentials, s3Client } = credentialResult.data!

        // サービス層に処理を委譲
        const result = await getCloudDataInfo(s3Client, credentials.bucketName, gameId)

        return result
      }
    )
  )

  /**
   * クラウドファイル詳細情報取得ハンドラー
   */
  ipcMain.handle(
    "cloud:getFileDetails",
    withFileOperationErrorHandling(
      async (
        _event,
        gameId: string
      ): Promise<
        ApiResult<{
          exists: boolean
          totalSize: number
          files: Array<{
            name: string
            size: number
            lastModified: Date
            key: string
          }>
        }>
      > => {
        const credentialResult = await validateCredentialsForR2()
        if (!credentialResult.success) {
          return { success: false, message: credentialResult.message }
        }

        const { credentials, s3Client } = credentialResult.data!

        // サービス層に処理を委譲
        const result = await getCloudFileDetails(s3Client, credentials.bucketName, gameId)

        return result
      }
    )
  )
}
