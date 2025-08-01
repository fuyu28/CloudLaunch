/**
 * @fileoverview 統一ログ機能
 *
 * このファイルは、アプリケーション全体で使用される統一ログ機能を提供します。
 * 主な機能：
 * - レベル別ログ出力（debug, info, warn, error）
 * - 本番環境でのデバッグログ抑制
 * - エラーオブジェクトの詳細表示
 * - ログフォーマットの統一
 * - ファイル出力とローテーション
 * - スタックトレースの詳細記録
 */

import * as fs from "node:fs"
import * as path from "node:path"

import { app } from "electron"

import { generateLogTimestamp } from "../service/validation/commonSchemas"

/**
 * ログレベル
 */
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

/**
 * ログエントリ
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  stack?: string
}

/**
 * ログ設定
 */
interface LoggerConfig {
  /** ファイル出力を有効にするか */
  enableFileLogging: boolean
  /** ログファイルの最大サイズ（バイト） */
  maxFileSize: number
  /** 保持するログファイル数 */
  maxFiles: number
  /** ログディレクトリ */
  logDirectory: string
}

/**
 * 統一ログ機能
 */
class Logger {
  private readonly isDevelopment: boolean
  private readonly config: LoggerConfig
  private readonly logFilePath: string

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
    this.config = {
      enableFileLogging: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      logDirectory: this.getLogDirectory()
    }
    this.logFilePath = path.join(this.config.logDirectory, "cloudlaunch.log")
    this.ensureLogDirectory()
  }

  /**
   * ログディレクトリのパスを取得
   */
  private getLogDirectory(): string {
    try {
      const userDataPath = app.getPath("userData")
      return path.join(userDataPath, "logs")
    } catch {
      // Electronが利用できない場合（テスト環境など）
      return path.join(process.cwd(), "logs")
    }
  }

  /**
   * ログディレクトリの作成
   */
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.config.logDirectory)) {
        fs.mkdirSync(this.config.logDirectory, { recursive: true })
      }
    } catch (error) {
      console.error("ログディレクトリの作成に失敗しました:", error)
    }
  }

  /**
   * ログエントリをフォーマット
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [entry.timestamp, `[${entry.level}]`, entry.message]

    if (entry.data !== undefined) {
      const dataStr =
        typeof entry.data === "object" ? JSON.stringify(entry.data, null, 2) : String(entry.data)
      parts.push(`\nData: ${dataStr}`)
    }

    if (entry.stack) {
      parts.push(`\nStack: ${entry.stack}`)
    }

    return parts.join(" ") + "\n"
  }

  /**
   * ログをファイルに書き込み
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFileLogging) return

    try {
      // ファイルサイズをチェックしてローテーション
      this.rotateLogIfNeeded()

      const logLine = this.formatLogEntry(entry)
      fs.appendFileSync(this.logFilePath, logLine, "utf8")
    } catch (error) {
      console.error("ログファイルへの書き込みに失敗しました:", error)
    }
  }

  /**
   * ログファイルのローテーション
   */
  private rotateLogIfNeeded(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) return

      const stats = fs.statSync(this.logFilePath)
      if (stats.size < this.config.maxFileSize) return

      // 既存のローテーションファイルをシフト
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = `${this.logFilePath}.${i}`
        const newFile = `${this.logFilePath}.${i + 1}`

        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldFile) // 最古のファイルを削除
          } else {
            fs.renameSync(oldFile, newFile)
          }
        }
      }

      // 現在のログファイルを.1にリネーム
      if (fs.existsSync(this.logFilePath)) {
        fs.renameSync(this.logFilePath, `${this.logFilePath}.1`)
      }
    } catch (error) {
      console.error("ログローテーションに失敗しました:", error)
    }
  }

  /**
   * ログエントリを作成
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): LogEntry {
    const timestamp = generateLogTimestamp()

    return {
      timestamp,
      level,
      message,
      data,
      stack: error?.stack
    }
  }

  /**
   * ログを出力
   */
  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    const entry = this.createLogEntry(level, message, data, error)

    // コンソール出力
    const consoleMessage = `[${level}] ${message}`
    switch (level) {
      case "DEBUG":
        if (this.isDevelopment) {
          console.log(consoleMessage, data ?? "")
        }
        break
      case "INFO":
        console.log(consoleMessage, data ?? "")
        break
      case "WARN":
        console.warn(consoleMessage, data ?? "")
        break
      case "ERROR":
        console.error(consoleMessage, error ?? data ?? "")
        break
    }

    // ファイル出力
    this.writeToFile(entry)
  }

  /**
   * デバッグログ（開発環境のみ）
   * @param message メッセージ
   * @param data 追加データ
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.log("DEBUG", message, data)
    }
  }

  /**
   * 情報ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  info(message: string, data?: unknown): void {
    this.log("INFO", message, data)
  }

  /**
   * 警告ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  warn(message: string, data?: unknown): void {
    this.log("WARN", message, data)
  }

  /**
   * エラーログ
   * @param message メッセージ
   * @param error エラーオブジェクト
   * @param data 追加データ
   */
  error(message: string, error?: unknown, data?: unknown): void {
    const errorObj = error instanceof Error ? error : undefined
    this.log("ERROR", message, data, errorObj)
  }

  /**
   * ログファイルのパスを取得
   */
  getLogFilePath(): string {
    return this.logFilePath
  }

  /**
   * ログディレクトリのパスを取得
   */
  getLogDirectoryPath(): string {
    return this.config.logDirectory
  }

  /**
   * ログ設定を取得
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }

  /**
   * ログファイルを手動でローテーション
   */
  forceRotate(): void {
    this.rotateLogIfNeeded()
  }

  /**
   * 古いログファイルをクリーンアップ
   */
  cleanup(): void {
    try {
      for (let i = this.config.maxFiles; i <= 10; i++) {
        const oldFile = `${this.logFilePath}.${i}`
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile)
        }
      }
    } catch (error) {
      console.error("ログファイルのクリーンアップに失敗しました:", error)
    }
  }
}

export const logger = new Logger()
export type { LogLevel, LogEntry, LoggerConfig }
