/**
 * @fileoverview 共通エラーハンドリングユーティリティ
 *
 * このファイルは、アプリケーション全体で使用されるエラーハンドリング機能を提供します。
 * 主な機能：
 * - ApiResult型の統一的なエラーハンドリング
 * - トースト通知の表示
 * - エラーログの記録
 */

import toast from "react-hot-toast"

import { logger } from "@renderer/utils/logger"

import type { ApiResult } from "../../../types/result"

/**
 * ApiResultのエラーハンドリングとトースト表示
 * @param result - API結果
 * @param fallbackMessage - result.messageが空の場合のフォールバックメッセージ
 * @param toastId - 既存のトーストIDを指定する場合（ローディング表示の更新など）
 */
export function handleApiError<T = void>(
  result: ApiResult<T>,
  fallbackMessage: string = "エラーが発生しました",
  toastId?: string
): void {
  let message: string

  if (result.success) {
    message = fallbackMessage
  } else {
    // result.success === false の場合、result.message が存在する
    message = (result as { success: false; message: string }).message || fallbackMessage
  }

  if (toastId) {
    toast.error(message, { id: toastId })
  } else {
    toast.error(message)
  }
}

/**
 * 予期しないエラーのハンドリング
 * @param error - キャッチされたエラー
 * @param context - エラーが発生したコンテキスト
 * @param toastId - 既存のトーストIDを指定する場合
 */
export function handleUnexpectedError(error: unknown, context: string, toastId?: string): void {
  // デバッグ時のみコンソールにログ出力
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  if (isDev) {
    logger.error(`予期しないエラー (${context}):`, {
      component: "errorHandler",
      function: "handleUnexpectedError",
      error: error instanceof Error ? error : new Error(String(error)),
      data: { context }
    })
  }

  const message = "予期しないエラーが発生しました"
  if (toastId) {
    toast.error(message, { id: toastId })
  } else {
    toast.error(message)
  }
}

/**
 * 成功時のトースト表示
 * @param message - 成功メッセージ
 * @param toastId - 既存のトーストIDを指定する場合
 */
export function showSuccessToast(message: string, toastId?: string): void {
  if (toastId) {
    toast.success(message, { id: toastId })
  } else {
    toast.success(message)
  }
}

/**
 * ローディング付きの非同期操作ヘルパー
 * @param asyncOperation - 実行する非同期操作
 * @param loadingMessage - ローディング中のメッセージ
 * @param successMessage - 成功時のメッセージ
 * @param errorContext - エラーコンテキスト
 * @returns 操作結果
 */
export async function withLoadingToast<T>(
  asyncOperation: () => Promise<ApiResult<T>>,
  loadingMessage: string,
  successMessage: string,
  errorContext: string
): Promise<ApiResult<T>> {
  const loadingToastId = toast.loading(loadingMessage)

  try {
    const result = await asyncOperation()

    if (result.success) {
      showSuccessToast(successMessage, loadingToastId)
    } else {
      handleApiError(result, "エラーが発生しました", loadingToastId)
    }

    return result
  } catch (error) {
    handleUnexpectedError(error, errorContext, loadingToastId)
    return { success: false, message: "予期しないエラーが発生しました" }
  }
}
