/**
 * @fileoverview IPC共通エラーハンドリングミドルウェア
 *
 * このモジュールは、IPC ハンドラーで発生するエラーを統一的に処理するためのミドルウェアを提供します。
 *
 * 主な機能：
 * - 共通エラーハンドリングパターンの提供
 * - AWS SDK エラーの統一的な処理
 * - ログ出力の統一化
 * - ApiResult 形式でのエラーレスポンス生成
 *
 * 使用方法：
 * ```typescript
 * export function registerMyHandler(): void {
 *   ipcMain.handle('my-api', withErrorHandling(async (event, param) => {
 *     // 処理ロジック
 *     return { success: true, data: result }
 *   }))
 * }
 * ```
 */

import { handleAwsSdkError } from "./awsSdkErrorHandler"
import { createErrorResult } from "./errorHandler"
import { logger } from "./logger"
import { MESSAGES } from "../../constants"
import type { ApiResult } from "../../types/result"
import type { IpcMainInvokeEvent } from "electron"

/**
 * IPC ハンドラー関数の型定義
 */
export type IpcHandler<T extends unknown[] = unknown[], R = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: T
) => Promise<ApiResult<R>>

/**
 * エラーハンドリング設定オプション
 */
export type ErrorHandlingOptions = {
  /** カスタムエラーメッセージプレフィックス */
  errorPrefix?: string
  /** ログ出力を無効にする場合は true */
  disableLogging?: boolean
  /** 不明なエラーのデフォルトメッセージ */
  unknownErrorMessage?: string
}

/**
 * IPC ハンドラーにエラーハンドリングを適用するミドルウェア
 *
 * このミドルウェアは以下の処理を自動的に実行します：
 * 1. try-catch によるエラーキャッチ
 * 2. エラーの詳細ログ出力
 * 3. AWS SDK エラーの特別処理
 * 4. 統一的な ApiResult 形式でのエラーレスポンス生成
 *
 * @param handler 元の IPC ハンドラー関数
 * @param options エラーハンドリングのオプション設定
 * @returns エラーハンドリングが適用された IPC ハンドラー関数
 */
export function withErrorHandling<T extends unknown[] = unknown[], R = unknown>(
  handler: IpcHandler<T, R>,
  options: ErrorHandlingOptions = {}
): IpcHandler<T, R> {
  const { errorPrefix = "処理中にエラーが発生しました", disableLogging = false } = options

  return async (event: IpcMainInvokeEvent, ...args: T): Promise<ApiResult<R>> => {
    try {
      return await handler(event, ...args)
    } catch (error: unknown) {
      // AWS SDK エラーの特別処理
      const awsSdkError = handleAwsSdkError(error)
      if (awsSdkError) {
        if (!disableLogging) {
          logger.error(`${errorPrefix}: AWS SDKエラー:`, error)
        }
        return {
          success: false,
          message: `${errorPrefix}: ${awsSdkError.message}`
        }
      }

      // 統一エラーハンドリングを使用
      const errorResult = createErrorResult(error, errorPrefix)

      // ログ出力の重複を避けるため、createErrorResultでログが出力されるのでここでは出力しない
      return errorResult as ApiResult<R>
    }
  }
}

/**
 * 認証情報エラーハンドリング専用のミドルウェア
 *
 * 認証情報関連のエラーに特化したエラーハンドリングを提供します。
 *
 * @param handler 元の IPC ハンドラー関数
 * @returns 認証情報エラーハンドリングが適用された IPC ハンドラー関数
 */
export function withCredentialErrorHandling<T extends unknown[] = unknown[], R = unknown>(
  handler: IpcHandler<T, R>
): IpcHandler<T, R> {
  return withErrorHandling(handler, {
    errorPrefix: "認証情報の処理中にエラーが発生しました",
    unknownErrorMessage: "認証情報の処理中に不明なエラーが発生しました"
  })
}

/**
 * ファイル操作エラーハンドリング専用のミドルウェア
 *
 * ファイル操作関連のエラーに特化したエラーハンドリングを提供します。
 *
 * @param handler 元の IPC ハンドラー関数
 * @returns ファイル操作エラーハンドリングが適用された IPC ハンドラー関数
 */
export function withFileOperationErrorHandling<T extends unknown[] = unknown[], R = unknown>(
  handler: IpcHandler<T, R>
): IpcHandler<T, R> {
  return withErrorHandling(handler, {
    errorPrefix: MESSAGES.IPC_ERROR.FILE_OPERATION_FAILED,
    unknownErrorMessage: MESSAGES.IPC_ERROR.FILE_OPERATION_UNKNOWN
  })
}
