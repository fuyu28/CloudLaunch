/**
 * @fileoverview ログレベル設定管理
 *
 * このファイルは、ログレベルの動的設定と管理を提供します。
 * 主な機能：
 * - 実行時ログレベル変更
 * - 環境別デフォルト設定
 * - 設定の永続化
 * - ログレベル階層の管理
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "off"

/**
 * ログレベルの優先度（数字が大きいほど高い優先度）
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  off: 4
}

/**
 * ログレベル設定管理クラス
 */
class LogLevelManager {
  private currentLevel: LogLevel
  private defaultLevel: LogLevel

  constructor() {
    this.defaultLevel = this.getDefaultLogLevel()
    this.currentLevel = this.loadSavedLogLevel() || this.defaultLevel
  }

  /**
   * 環境に基づくデフォルトログレベルを取得
   */
  private getDefaultLogLevel(): LogLevel {
    const nodeEnv = process.env.NODE_ENV

    switch (nodeEnv) {
      case "development":
        return "debug"
      case "test":
        return "warn"
      case "production":
        return "info"
      default:
        return "info"
    }
  }

  /**
   * 保存されたログレベルを読み込み
   */
  private loadSavedLogLevel(): LogLevel | null {
    try {
      const saved = localStorage.getItem("cloudlaunch_log_level")
      if (saved && this.isValidLogLevel(saved)) {
        return saved as LogLevel
      }
    } catch (error) {
      console.warn("ログレベル設定の読み込みに失敗:", error)
    }
    return null
  }

  /**
   * ログレベルを保存
   */
  private saveLogLevel(level: LogLevel): void {
    try {
      localStorage.setItem("cloudlaunch_log_level", level)
    } catch (error) {
      console.warn("ログレベル設定の保存に失敗:", error)
    }
  }

  /**
   * 有効なログレベルかチェック
   */
  private isValidLogLevel(level: string): boolean {
    return Object.keys(LOG_LEVEL_PRIORITY).includes(level)
  }

  /**
   * 現在のログレベルを取得
   */
  getCurrentLevel(): LogLevel {
    return this.currentLevel
  }

  /**
   * ログレベルを設定
   */
  setLevel(level: LogLevel): void {
    if (!this.isValidLogLevel(level)) {
      throw new Error(`無効なログレベル: ${level}`)
    }

    this.currentLevel = level
    this.saveLogLevel(level)

    // 設定変更をログに記録（ただし、offに設定する場合は記録しない）
    if (level !== "off") {
      console.info(`ログレベルを変更しました: ${level}`)
    }
  }

  /**
   * ログレベルをデフォルトにリセット
   */
  resetToDefault(): void {
    this.setLevel(this.defaultLevel)
  }

  /**
   * 指定されたログレベルが現在の設定で出力されるかチェック
   */
  shouldLog(level: LogLevel): boolean {
    if (this.currentLevel === "off") {
      return false
    }

    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.currentLevel]
  }

  /**
   * デフォルトログレベルを取得
   */
  getDefaultLevel(): LogLevel {
    return this.defaultLevel
  }

  /**
   * 利用可能なログレベル一覧を取得
   */
  getAvailableLevels(): LogLevel[] {
    return Object.keys(LOG_LEVEL_PRIORITY) as LogLevel[]
  }

  /**
   * ログレベルの説明を取得
   */
  getLevelDescription(level: LogLevel): string {
    const descriptions: Record<LogLevel, string> = {
      debug: "すべてのログを出力（開発時のみ推奨）",
      info: "情報、警告、エラーログを出力",
      warn: "警告とエラーログのみ出力",
      error: "エラーログのみ出力",
      off: "ログ出力を無効化"
    }

    return descriptions[level]
  }

  /**
   * 現在の設定の詳細情報を取得
   */
  getConfigInfo(): {
    current: LogLevel
    default: LogLevel
    environment: string
    description: string
  } {
    return {
      current: this.currentLevel,
      default: this.defaultLevel,
      environment: process.env.NODE_ENV || "unknown",
      description: this.getLevelDescription(this.currentLevel)
    }
  }
}

// シングルトンインスタンス
export const logLevelManager = new LogLevelManager()

/**
 * ログレベル管理用のReactフック
 */
export function useLogLevel(): {
  currentLevel: LogLevel
  setLevel: (level: LogLevel) => void
  resetToDefault: () => void
  shouldLog: (level: LogLevel) => boolean
  availableLevels: LogLevel[]
  getLevelDescription: (level: LogLevel) => string
  configInfo: {
    current: LogLevel
    default: LogLevel
    environment: string
    description: string
  }
} {
  const getCurrentLevel = (): LogLevel => logLevelManager.getCurrentLevel()
  const setLevel = (level: LogLevel): void => logLevelManager.setLevel(level)
  const resetToDefault = (): void => logLevelManager.resetToDefault()
  const shouldLog = (level: LogLevel): boolean => logLevelManager.shouldLog(level)
  const getAvailableLevels = (): LogLevel[] => logLevelManager.getAvailableLevels()
  const getLevelDescription = (level: LogLevel): string =>
    logLevelManager.getLevelDescription(level)
  const getConfigInfo = (): {
    current: LogLevel
    default: LogLevel
    environment: string
    description: string
  } => logLevelManager.getConfigInfo()

  return {
    currentLevel: getCurrentLevel(),
    setLevel,
    resetToDefault,
    shouldLog,
    availableLevels: getAvailableLevels(),
    getLevelDescription,
    configInfo: getConfigInfo()
  }
}

/**
 * ログレベル設定コンポーネント用のプロパティ
 */
export interface LogLevelSettingsProps {
  onLevelChange?: (level: LogLevel) => void
  showDescription?: boolean
  compact?: boolean
}
