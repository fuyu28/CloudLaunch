/**
 * @fileoverview ローディング状態管理フック
 *
 * このフックは、非同期処理のローディング状態とエラー状態を管理します。
 * 主な機能：
 * - ローディング状態の管理
 * - エラー状態の管理
 * - トースト通知の統合
 * - 非同期処理の実行ヘルパー
 *
 * 使用例：
 * ```tsx
 * const { isLoading, error, executeWithLoading } = useLoadingState()
 * ```
 */

import { useState, useCallback } from "react"
import { useToastHandler, executeWithToast, type ToastOptions } from "./useToastHandler"

/**
 * ローディング状態の型定義
 */
export interface LoadingState {
  /** ローディング中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

/**
 * ローディング状態管理フック
 *
 * 非同期処理のローディング状態とエラー状態を管理し、
 * トースト通知と統合された実行ヘルパーを提供します。
 *
 * @param initialLoading - 初期ローディング状態
 * @returns ローディング状態管理機能
 */
export function useLoadingState(initialLoading = false): {
  /** ローディング中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
  /** ローディング状態を設定 */
  setLoading: (loading: boolean) => void
  /** エラー状態を設定 */
  setError: (error: string | null) => void
  /** 状態をリセット */
  reset: () => void
  /** トースト付きで非同期処理を実行 */
  executeWithLoading: <T>(asyncFn: () => Promise<T>, options?: ToastOptions) => Promise<T | null>
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null
  })
  const toastHandler = useToastHandler()

  /**
   * ローディング状態を設定する
   *
   * @param loading - ローディング中かどうか
   */
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }))
  }, [])

  /**
   * エラー状態を設定する
   *
   * @param error - エラーメッセージまたはnull
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  /**
   * 状態をリセットする
   */
  const reset = useCallback(() => {
    setState({ isLoading: false, error: null })
  }, [])

  /**
   * トースト付きで非同期処理を実行する
   *
   * @param asyncFn - 実行する非同期関数
   * @param options - トーストオプション
   * @returns 実行結果またはnull
   */
  const executeWithLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>, options?: ToastOptions): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)

        const result = await executeWithToast(asyncFn, options || {}, toastHandler)
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        setError(errorMsg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, toastHandler]
  )

  return {
    ...state,
    setLoading,
    setError,
    reset,
    executeWithLoading
  }
}
