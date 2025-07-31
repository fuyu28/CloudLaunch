/**
 * @fileoverview エラー報告Preload API
 *
 * このファイルは、レンダラープロセスからメインプロセスへのエラー報告機能を提供します。
 * 主な機能：
 * - エラー報告の送信
 * - エラー統計の取得
 * - ログ管理機能へのアクセス
 */

import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

/**
 * フロントエンドエラー報告のデータ構造
 */
export interface FrontendErrorReport {
  message: string
  stack: string
  componentStack?: string
  context?: string
  timestamp: string
  url?: string
  userAgent?: string
}

/**
 * フロントエンドログレポートのデータ構造
 */
export interface FrontendLogReport {
  level: "debug" | "info" | "warn" | "error"
  message: string
  component?: string
  function?: string
  context?: string
  data?: unknown
  timestamp: string
}

/**
 * エラー統計の型定義
 */
export interface ErrorStatsData {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  lastError?: {
    code: string
    message: string
    context?: string
    stack?: string
    timestamp: Date
    userMessage: string
  }
}

/**
 * エラー報告API
 */
export const errorReportAPI = {
  /**
   * フロントエンドエラーを報告
   */
  reportError: (errorReport: FrontendErrorReport): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:report", errorReport)
  },

  /**
   * エラー統計を取得
   */
  getErrorStats: (): Promise<ApiResult<ErrorStatsData>> => {
    return ipcRenderer.invoke("error:getStats")
  },

  /**
   * エラー統計をリセット
   */
  resetErrorStats: (): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:resetStats")
  },

  /**
   * ログファイルのパスを取得
   */
  getLogPath: (): Promise<ApiResult<string>> => {
    return ipcRenderer.invoke("error:getLogPath")
  },

  /**
   * ログディレクトリを開く
   */
  openLogDirectory: (): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:openLogDirectory")
  },

  /**
   * ログをローテーション
   */
  rotateLog: (): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:rotateLog")
  },

  /**
   * 古いログをクリーンアップ
   */
  cleanupLogs: (): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:cleanupLogs")
  },

  /**
   * フロントエンドからログを報告
   */
  reportLog: (logReport: FrontendLogReport): Promise<ApiResult> => {
    return ipcRenderer.invoke("error:reportLog", logReport)
  }
}
