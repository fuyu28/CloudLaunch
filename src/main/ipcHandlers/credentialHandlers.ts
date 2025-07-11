/**
 * @fileoverview R2/S3認証情報管理のIPC通信ハンドラー
 *
 * このファイルは、クラウドストレージ（R2/S3）への接続に必要な認証情報の
 * 管理機能を提供します。
 *
 * 提供する機能：
 * - 認証情報の保存・更新（upsert-credential）
 * - 保存済み認証情報の取得（get-credential）
 * - 認証情報の有効性検証（validate-credential）
 *
 * セキュリティ機能：
 * - 実際のS3接続テストによる認証情報検証
 * - AWS SDK固有エラーの詳細解析とユーザーフレンドリーなメッセージ提供
 * - credentialServiceを通じたセキュアな認証情報管理
 */

import { ipcMain } from "electron"
import type { Creds } from "../../types/creds"
import { getCredential, setCredential } from "../service/credentialService"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { handleAwsSdkError } from "../utils/awsSdkErrorHandler"

import type { ApiResult } from "../../types/result"

export function registerCredentialHandlers(): void {
  /**
   * 認証情報の保存・更新API
   *
   * 提供されたR2/S3認証情報をセキュアに保存します。
   * - secretAccessKey: OSキーチェーンに暗号化保存
   * - その他の情報: electron-storeに保存
   *
   * @param creds 保存する認証情報（endpoint, region, bucketName, accessKeyId, secretAccessKey）
   * @returns ApiResult 保存結果（成功時はsuccess: true、失敗時はエラーメッセージ）
   */
  ipcMain.handle("upsert-credential", async (_event, creds: Creds): Promise<ApiResult> => {
    const result = await setCredential(creds)
    return result
  })

  /**
   * 保存済み認証情報の取得API
   *
   * OSキーチェーンとelectron-storeから認証情報を安全に取得します。
   * 認証情報が見つからない場合やアクセス権限エラーの場合は、
   * 詳細なエラーメッセージを返します。
   *
   * @returns ApiResult<Creds> 取得結果（成功時は認証情報、失敗時はエラーメッセージ）
   */
  ipcMain.handle("get-credential", async (): Promise<ApiResult<Creds>> => {
    const result = await getCredential()
    return result
  })

  /**
   * 認証情報の有効性検証API
   *
   * 提供された認証情報を使って実際にS3/R2への接続テストを行います。
   * ListObjectsV2Command（最大1件取得）を実行して接続可能性を確認。
   *
   * 検証内容：
   * - エンドポイントの到達可能性
   * - 認証情報（accessKeyId/secretAccessKey）の正当性
   * - バケットへのアクセス権限
   * - リージョン設定の正確性
   *
   * @param creds 検証する認証情報
   * @returns ApiResult 検証結果（成功時はsuccess: true、失敗時は詳細なエラーメッセージ）
   */
  ipcMain.handle("validate-credential", async (_event, creds: Creds): Promise<ApiResult> => {
    try {
      const r2Client = new S3Client({
        region: creds.region,
        endpoint: creds.endpoint,
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey
        }
      })
      await r2Client.send(
        new ListObjectsV2Command({
          Bucket: creds.bucketName,
          Delimiter: "/",
          MaxKeys: 1
        })
      )
      return { success: true }
    } catch (error: unknown) {
      const awsSdkError = handleAwsSdkError(error)
      return { success: false, message: awsSdkError.message }
    }
  })
}
