/**
 * @fileoverview セーブデータフォルダのクラウドアップロード機能
 *
 * このハンドラーは、フロントエンドからのアップロード関連リクエストを受け取り、
 * アップロードサービスに処理を委譲するIPCハンドラーを提供します。
 *
 * 責務：
 * - IPC通信の受信と基本的な入力検証
 * - 認証情報の検証
 * - サービス層への処理委譲
 * - レスポンスの形式変換
 */

import { ipcMain } from "electron"

import type { ApiResult } from "../../types/result"
import { uploadSaveDataFolder } from "../service/uploadService"
import { withValidatedCloudStorage } from "../utils/cloudStorageHelper"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"

export function registerUploadSaveDataFolderHandlers(): void {
  /**
   * セーブデータフォルダ一括アップロードAPI
   */
  ipcMain.handle(
    "cloud:uploadSaveData",
    withFileOperationErrorHandling(
      async (_event, localPath: string, remotePath: string): Promise<ApiResult<boolean>> => {
        return withValidatedCloudStorage(async (credentials, s3Client) => {
          // サービス層に処理を委譲
          const result = await uploadSaveDataFolder(
            s3Client,
            credentials.bucketName,
            localPath,
            remotePath
          )

          return result
        })
      }
    )
  )
}
