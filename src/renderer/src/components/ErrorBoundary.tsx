/**
 * @fileoverview Reactエラーバウンダリ
 *
 * このファイルは、Reactコンポーネントツリー内で発生するJavaScriptエラーを
 * キャッチし、フォールバックUIを表示するエラーバウンダリを提供します。
 * 主な機能：
 * - レンダリングエラーのキャッチ
 * - エラーログの記録
 * - ユーザーフレンドリーなエラー表示
 * - エラー詳細の表示/非表示切り替え
 * - リトライ機能
 */

import React, { Component } from "react"
import { FiAlertTriangle, FiRefreshCw, FiChevronDown, FiChevronUp } from "react-icons/fi"

import { logger } from "../utils/logger"
import type { ReactNode } from "react"

/**
 * エラーバウンダリのProps
 */
interface ErrorBoundaryProps {
  /** 子コンポーネント */
  children: ReactNode
  /** フォールバック表示をカスタマイズする場合 */
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode
  /** エラー発生時のコールバック */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** リセット時のコールバック */
  onReset?: () => void
}

/**
 * エラーバウンダリのState
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

/**
 * Reactエラーバウンダリコンポーネント
 *
 * React コンポーネントツリー内のJavaScriptエラーをキャッチし、
 * エラーログを記録してフォールバックUIを表示します。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  /**
   * エラーキャッチ時に呼ばれる
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  /**
   * エラー詳細をキャッチ
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("ErrorBoundary caught an error", {
      component: "ErrorBoundary",
      function: "componentDidCatch",
      error,
      data: errorInfo
    })

    this.setState({
      errorInfo
    })

    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // メインプロセスにエラーを報告
    window.api.errorReport.reportError({
      message: error.message,
      stack: error.stack || "",
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * エラー状態をリセット
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  /**
   * エラー詳細の表示/非表示を切り替え
   */
  toggleDetails = (): void => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails
    }))
  }

  /**
   * デフォルトのフォールバックUI
   */
  renderDefaultFallback(): React.JSX.Element {
    const { error, errorInfo, showDetails } = this.state

    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="max-w-2xl w-full">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center">
              <div className="flex justify-center mb-4">
                <FiAlertTriangle className="text-6xl text-error" />
              </div>

              <h1 className="card-title text-2xl justify-center mb-4 text-error">
                予期しないエラーが発生しました
              </h1>

              <p className="text-base-content/70 mb-6">
                アプリケーションでエラーが発生しました。ページを再読み込みするか、
                しばらく待ってから再試行してください。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <button className="btn btn-primary" onClick={this.handleReset}>
                  <FiRefreshCw className="mr-2" />
                  再試行
                </button>

                <button className="btn btn-outline" onClick={() => window.location.reload()}>
                  ページを再読み込み
                </button>
              </div>

              {/* エラー詳細の表示/非表示ボタン */}
              <div className="border-t border-base-300 pt-4">
                <button className="btn btn-ghost btn-sm" onClick={this.toggleDetails}>
                  エラー詳細
                  {showDetails ? (
                    <FiChevronUp className="ml-1" />
                  ) : (
                    <FiChevronDown className="ml-1" />
                  )}
                </button>
              </div>

              {/* エラー詳細 */}
              {showDetails && error && (
                <div className="mt-4 text-left">
                  <div className="collapse collapse-open bg-base-300">
                    <div className="collapse-content">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-sm mb-2">エラーメッセージ:</h3>
                          <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto">
                            {error.message}
                          </pre>
                        </div>

                        {error.stack && (
                          <div>
                            <h3 className="font-bold text-sm mb-2">スタックトレース:</h3>
                            <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}

                        {errorInfo?.componentStack && (
                          <div>
                            <h3 className="font-bold text-sm mb-2">コンポーネントスタック:</h3>
                            <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        <div className="text-xs text-base-content/50">
                          <p>この情報は開発者がエラーを修正するために使用されます。</p>
                          <p>個人情報は含まれていません。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // カスタムフォールバックがある場合はそれを使用
      if (fallback) {
        return fallback(error, errorInfo!, this.handleReset)
      }

      // デフォルトフォールバックを使用
      return this.renderDefaultFallback()
    }

    return children
  }
}

/**
 * エラーバウンダリの設定オプション
 */
export interface ErrorBoundaryOptions {
  fallback?: ErrorBoundaryProps["fallback"]
  onError?: ErrorBoundaryProps["onError"]
  onReset?: ErrorBoundaryProps["onReset"]
}

/**
 * HOC形式のエラーバウンダリ
 *
 * @param Component - ラップするコンポーネント
 * @param options - エラーバウンダリのオプション
 * @returns エラーバウンダリでラップされたコンポーネント
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: ErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.JSX.Element => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * エラーバウンダリのフック版
 *
 * 関数コンポーネント内でエラーバウンダリのような機能を提供します。
 * （実際のレンダリングエラーはキャッチできないため、手動エラー処理用）
 */
export function useErrorHandler(): { handleError: (error: Error, context?: string) => void } {
  const handleError = React.useCallback((error: Error, context?: string) => {
    logger.error("Manual error handling", {
      component: "useErrorHandler",
      function: "handleError",
      error,
      context
    })

    // メインプロセスにエラーを報告
    window.api.errorReport.reportError({
      message: error.message,
      stack: error.stack || "",
      context,
      timestamp: new Date().toISOString()
    })
  }, [])

  return { handleError }
}
