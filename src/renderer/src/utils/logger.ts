/**
 * @fileoverview レンダラープロセス用ログユーティリティ
 *
 * このファイルは、レンダラープロセスで使用するログ機能を提供します。
 * 主な機能：
 * - メインプロセスのログシステムとの連携
 * - 開発/本番環境での自動切り替え
 * - console.*の代替として使用
 */

import { logLevelManager, type LogLevel } from "./logLevel"

/**
 * ログメタデータ
 */
export interface LogMetadata {
  /** ログが発生したコンポーネント名 */
  component?: string
  /** ログが発生した関数名 */
  function?: string
  /** 追加のコンテキスト情報 */
  context?: string
  /** エラーオブジェクト */
  error?: Error
  /** 任意の追加データ */
  data?: unknown
}

/**
 * レンダラープロセス用ログクラス
 *
 * メインプロセスのログシステムと連携して
 * 統一的なログ出力を提供します。
 */
class RendererLogger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
  }

  /**
   * デバッグログを出力
   * ログレベル設定と開発環境をチェック
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (!logLevelManager.shouldLog("debug")) {
      return
    }

    if (this.isDevelopment) {
      this.logToConsole("debug", message, metadata)
    }
    // 本番環境でもログレベル設定次第で出力
    this.logToMain("debug", message, metadata)
  }

  /**
   * 情報ログを出力
   */
  info(message: string, metadata?: LogMetadata): void {
    if (!logLevelManager.shouldLog("info")) {
      return
    }

    this.logToConsole("info", message, metadata)
    this.logToMain("info", message, metadata)
  }

  /**
   * 警告ログを出力
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (!logLevelManager.shouldLog("warn")) {
      return
    }

    this.logToConsole("warn", message, metadata)
    this.logToMain("warn", message, metadata)
  }

  /**
   * エラーログを出力
   */
  error(message: string, metadata?: LogMetadata): void {
    if (!logLevelManager.shouldLog("error")) {
      return
    }

    this.logToConsole("error", message, metadata)
    this.logToMain("error", message, metadata)

    // エラーバウンダリシステムにも報告
    if (metadata?.error && window.api?.errorReport?.reportError) {
      window.api.errorReport.reportError({
        message: metadata.error.message,
        stack: metadata.error.stack || "",
        context: `${metadata.component || "unknown"}:${metadata.function || "unknown"} - ${message}`,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * コンソールにログを出力
   */
  private logToConsole(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const timestamp = new Date().toISOString()
    const componentInfo = metadata?.component
      ? `[${metadata.component}${metadata.function ? `:${metadata.function}` : ""}]`
      : ""

    const logMessage = `${timestamp} ${componentInfo} ${message}`

    switch (level) {
      case "debug":
        console.log(`🐛 ${logMessage}`, metadata?.data)
        break
      case "info":
        console.log(`ℹ️ ${logMessage}`, metadata?.data)
        break
      case "warn":
        console.warn(`⚠️ ${logMessage}`, metadata?.data)
        break
      case "error":
        console.error(`❌ ${logMessage}`, metadata?.error || metadata?.data)
        break
    }
  }

  /**
   * メインプロセスにログを送信
   */
  private logToMain(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    metadata?: LogMetadata
  ): void {
    // メインプロセスのログAPIが利用可能な場合のみ送信
    if (window.api?.errorReport?.reportLog) {
      window.api.errorReport.reportLog({
        level,
        message,
        component: metadata?.component,
        function: metadata?.function,
        context: metadata?.context,
        data: metadata?.data,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * ユーザーアクションをログに記録
   */
  logUserAction(action: string, details?: Record<string, unknown>): void {
    this.info(`ユーザーアクション: ${action}`, {
      component: "UserAction",
      data: details
    })
  }

  /**
   * パフォーマンス測定を開始
   */
  startPerformanceTimer(label: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.info(`パフォーマンス測定: ${label}`, {
        component: "Performance",
        data: { duration: `${duration.toFixed(2)}ms` }
      })
    }
  }
}

// シングルトンインスタンスを作成
export const logger = new RendererLogger()

/**
 * 従来のconsole.*メソッドの代替
 * 既存コードの移行を簡単にするためのヘルパー関数
 */
export const logHelpers = {
  /**
   * console.log の代替
   */
  log: (message: string, data?: unknown, component?: string): void => {
    logger.debug(message, { component, data })
  },

  /**
   * console.warn の代替
   */
  warn: (message: string, data?: unknown, component?: string): void => {
    logger.warn(message, { component, data })
  },

  /**
   * console.error の代替
   */
  error: (message: string, error?: Error | unknown, component?: string): void => {
    const errorObj = error instanceof Error ? error : undefined
    const data = error instanceof Error ? undefined : error
    logger.error(message, { component, error: errorObj, data })
  }
}

// 開発者向けのデバッグ用（本番では削除される）
if (process.env.NODE_ENV === "development") {
  // グローバルに公開してブラウザのデベロッパーツールから使用可能にする
  ;(window as unknown as Window & { logger: typeof logger }).logger = logger
}
