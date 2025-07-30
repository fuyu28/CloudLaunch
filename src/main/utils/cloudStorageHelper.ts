/**
 * @fileoverview クラウドストレージ操作のヘルパー関数
 *
 * このモジュールは、クラウドストレージ操作における共通パターンを
 * 抽象化し、重複コードの削減と一貫性の向上を図ります。
 *
 * 主な機能：
 * - 認証情報検証とS3Client作成の統一処理
 * - 共通エラーハンドリングパターンの提供
 * - クラウドストレージ操作の高次関数
 */

import { validateCredentialsForR2 } from "./credentialValidator"
import type { Creds } from "../../types/creds"
import type { ApiResult } from "../../types/result"
import type { S3Client } from "@aws-sdk/client-s3"

/**
 * 認証情報検証とS3Client作成を統一的に処理するヘルパー関数
 *
 * この関数は以下の共通処理パターンを抽象化します：
 * 1. validateCredentialsForR2() の呼び出し
 * 2. 成功チェックとエラー処理
 * 3. credentials と s3Client の分割代入
 * 4. ハンドラー関数の実行
 *
 * @param handler クラウドストレージ操作を実行するハンドラー関数
 * @returns Promise<ApiResult<T>> ハンドラーの実行結果
 *
 * @example
 * ```typescript
 * export function registerMyHandler(): void {
 *   ipcMain.handle('my-api', withFileOperationErrorHandling(
 *     async (): Promise<ApiResult<MyData[]>> => {
 *       return withValidatedCloudStorage(async (credentials, s3Client) => {
 *         // ここでクラウドストレージ操作を実行
 *         const result = await someCloudOperation(s3Client, credentials.bucketName)
 *         return { success: true, data: result }
 *       })
 *     }
 *   ))
 * }
 * ```
 */
export async function withValidatedCloudStorage<T>(
  handler: (credentials: Creds, s3Client: S3Client) => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
  // 認証情報の検証とR2クライアントの作成
  const validationResult = await validateCredentialsForR2()
  if (!validationResult.success) {
    return validationResult
  }

  const { credentials, s3Client } = validationResult.data!

  // ハンドラー関数を実行
  return await handler(credentials, s3Client)
}

/**
 * 同期的な処理に対応したバリエーション
 *
 * 戻り値が直接的にAPIResultの場合に使用します。
 *
 * @param handler クラウドストレージ操作を実行するハンドラー関数
 * @returns Promise<ApiResult<T>> ハンドラーの実行結果
 */
export async function withValidatedCloudStorageSync<T>(
  handler: (credentials: Creds, s3Client: S3Client) => ApiResult<T>
): Promise<ApiResult<T>> {
  // 認証情報の検証とR2クライアントの作成
  const validationResult = await validateCredentialsForR2()
  if (!validationResult.success) {
    return validationResult
  }

  const { credentials, s3Client } = validationResult.data!

  // ハンドラー関数を実行
  return handler(credentials, s3Client)
}

/**
 * void戻り値に対応したバリエーション
 *
 * 戻り値がない処理の場合に使用します。
 *
 * @param handler クラウドストレージ操作を実行するハンドラー関数
 * @returns Promise<ApiResult> 処理結果
 */
export async function withValidatedCloudStorageVoid(
  handler: (credentials: Creds, s3Client: S3Client) => Promise<void>
): Promise<ApiResult> {
  // 認証情報の検証とR2クライアントの作成
  const validationResult = await validateCredentialsForR2()
  if (!validationResult.success) {
    return validationResult
  }

  const { credentials, s3Client } = validationResult.data!

  try {
    // ハンドラー関数を実行
    await handler(credentials, s3Client)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "クラウドストレージ操作中にエラーが発生しました"
    }
  }
}
