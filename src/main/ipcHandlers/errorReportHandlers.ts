/**
 * @fileoverview エラー報告IPCハンドラー
 *
 * このファイルは、レンダラープロセスから送信されるエラー報告を処理します。
 * 主な機能：
 * - フロントエンドエラーの受信と記録
 * - エラー統計の管理
 * - エラーログの永続化
 * - エラー通知の処理
 */

import { ipcMain } from "electron"

import type { ApiResult } from "../../types/result"
import { createErrorResult, getErrorStats, resetErrorStats } from "../utils/errorHandler"
import { logger } from "../utils/logger"

/**
 * フロントエンドエラー報告のデータ構造
 */
interface FrontendErrorReport {
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
interface FrontendLogReport {
  level: "debug" | "info" | "warn" | "error"
  message: string
  component?: string
  function?: string
  context?: string
  data?: unknown
  timestamp: string
}

/**
 * エラー報告IPCハンドラーを登録
 */
export function registerErrorReportHandlers(): void {
  /**
   * フロントエンドエラーを報告
   */
  ipcMain.handle(
    "error:report",
    async (_, errorReport: FrontendErrorReport): Promise<ApiResult> => {
      try {
        logger.error("フロントエンドエラーが報告されました", {
          message: errorReport.message,
          timestamp: errorReport.timestamp,
          context: errorReport.context,
          url: errorReport.url
        })

        // エラー詳細をログに記録
        if (errorReport.stack) {
          logger.error("スタックトレース", { stack: errorReport.stack })
        }

        if (errorReport.componentStack) {
          logger.error("コンポーネントスタック", { componentStack: errorReport.componentStack })
        }

        return { success: true }
      } catch (error) {
        return createErrorResult(error, "フロントエンドエラー報告の処理")
      }
    }
  )

  /**
   * エラー統計を取得
   */
  ipcMain.handle(
    "error:getStats",
    async (): Promise<ApiResult<ReturnType<typeof getErrorStats>>> => {
      try {
        const stats = getErrorStats()
        return { success: true, data: stats }
      } catch (error) {
        return createErrorResult(error, "エラー統計の取得") as ApiResult<
          ReturnType<typeof getErrorStats>
        >
      }
    }
  )

  /**
   * エラー統計をリセット
   */
  ipcMain.handle("error:resetStats", async (): Promise<ApiResult> => {
    try {
      resetErrorStats()
      logger.info("エラー統計をリセットしました")
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "エラー統計のリセット")
    }
  })

  /**
   * ログファイルの場所を取得
   */
  ipcMain.handle("error:getLogPath", async (): Promise<ApiResult<string>> => {
    try {
      const logPath = logger.getLogFilePath()
      return { success: true, data: logPath }
    } catch (error) {
      return createErrorResult(error, "ログファイルパスの取得") as ApiResult<string>
    }
  })

  /**
   * ログディレクトリを開く
   */
  ipcMain.handle("error:openLogDirectory", async (): Promise<ApiResult> => {
    try {
      const { shell } = await import("electron")
      const logDirectory = logger.getLogDirectoryPath()
      await shell.openPath(logDirectory)
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "ログディレクトリを開く")
    }
  })

  /**
   * ログをローテーション
   */
  ipcMain.handle("error:rotateLog", async (): Promise<ApiResult> => {
    try {
      logger.forceRotate()
      logger.info("ログファイルを手動でローテーションしました")
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "ログローテーション")
    }
  })

  /**
   * 古いログをクリーンアップ
   */
  ipcMain.handle("error:cleanupLogs", async (): Promise<ApiResult> => {
    try {
      logger.cleanup()
      logger.info("古いログファイルをクリーンアップしました")
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "ログクリーンアップ")
    }
  })

  /**
   * フロントエンドからのログを受信
   */
  ipcMain.handle("error:reportLog", async (_, logReport: FrontendLogReport): Promise<ApiResult> => {
    try {
      const context = logReport.component
        ? `${logReport.component}${logReport.function ? `:${logReport.function}` : ""}`
        : "Frontend"

      const logMessage = `[${context}] ${logReport.message}`

      switch (logReport.level) {
        case "debug":
          logger.debug(logMessage, logReport.data)
          break
        case "info":
          logger.info(logMessage, logReport.data)
          break
        case "warn":
          logger.warn(logMessage, logReport.data)
          break
        case "error":
          logger.error(logMessage, logReport.data)
          break
      }

      return { success: true }
    } catch (error) {
      return createErrorResult(error, "フロントエンドログの処理")
    }
  })

  logger.info("エラー報告IPCハンドラーを登録しました")
}
