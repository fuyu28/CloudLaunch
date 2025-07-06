/**
 * @fileoverview トーストハンドリングフック
 *
 * このファイルは、非同期操作でのトースト通知を管理するフックを提供します。
 * 主な機能：
 * - ローディング、成功、エラーのトースト表示
 * - トーストの自動管理（ID管理、更新、削除）
 * - カスタマイズ可能なメッセージ
 */

import { useCallback } from "react"
import toast from "react-hot-toast"

/**
 * トーストオプション
 */
export interface ToastOptions {
  /** ローディング中のメッセージ */
  loadingMessage?: string
  /** 成功時のメッセージ */
  successMessage?: string
  /** エラー時のメッセージ */
  errorMessage?: string
  /** トースト表示を有効にするかどうか */
  showToast?: boolean
}

/**
 * トーストハンドラーの戻り値
 */
export interface ToastHandler {
  /** ローディングトーストを表示 */
  showLoading: (message?: string) => string | undefined
  /** 成功トーストを表示 */
  showSuccess: (message: string, toastId?: string) => void
  /** エラートーストを表示 */
  showError: (message: string, toastId?: string) => void
  /** トーストを削除 */
  dismiss: (toastId: string) => void
  /** 汎用トースト表示 */
  showToast: (message: string, type: "success" | "error" | "loading") => void
}

/**
 * トーストハンドリングフック
 *
 * 非同期操作での一貫したトースト表示を提供します。
 *
 * @returns トーストハンドラー
 */
export function useToastHandler(): ToastHandler {
  const showLoading = useCallback((message?: string): string | undefined => {
    if (message) {
      return toast.loading(message)
    }
    return undefined
  }, [])

  const showSuccess = useCallback((message: string, toastId?: string): void => {
    if (toastId) {
      toast.success(message, { id: toastId })
    } else {
      toast.success(message)
    }
  }, [])

  const showError = useCallback((message: string, toastId?: string): void => {
    if (toastId) {
      toast.error(message, { id: toastId })
    } else {
      toast.error(message)
    }
  }, [])

  const dismiss = useCallback((toastId: string): void => {
    toast.dismiss(toastId)
  }, [])

  const showToast = useCallback((message: string, type: "success" | "error" | "loading"): void => {
    switch (type) {
      case "success":
        toast.success(message)
        break
      case "error":
        toast.error(message)
        break
      case "loading":
        toast.loading(message)
        break
    }
  }, [])

  return {
    showLoading,
    showSuccess,
    showError,
    dismiss,
    showToast
  }
}

/**
 * 非同期操作とトースト処理を結合するヘルパー
 *
 * @param asyncFn - 実行する非同期関数
 * @param options - トーストオプション
 * @param toastHandler - トーストハンドラー
 * @returns 非同期操作の結果
 */
export async function executeWithToast<T>(
  asyncFn: () => Promise<T>,
  options: ToastOptions,
  toastHandler: ToastHandler
): Promise<T | null> {
  const { loadingMessage, successMessage, errorMessage, showToast = true } = options

  let toastId: string | undefined

  try {
    if (showToast && loadingMessage) {
      toastId = toastHandler.showLoading(loadingMessage)
    }

    const result = await asyncFn()

    if (showToast) {
      if (successMessage) {
        toastHandler.showSuccess(successMessage, toastId)
      } else if (toastId) {
        toastHandler.dismiss(toastId)
      }
    }

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    if (showToast) {
      const displayMessage = errorMessage || errorMsg
      toastHandler.showError(displayMessage, toastId)
    }

    // エラーを再スローして呼び出し元でハンドリングできるようにする
    throw error
  }
}
