import { logger } from "./logger"
import { MESSAGES } from "../../constants"
import type { ApiResult } from "../../types/result"

export class AppError extends Error {
  public readonly code: string
  public readonly details?: string

  constructor(code: string, message: string, details?: string) {
    super(message)
    this.code = code
    this.details = details
    this.name = "AppError"
  }
}

/**
 * エラー詳細情報
 */
export interface ErrorDetails {
  code: string
  message: string
  context?: string
  stack?: string
  timestamp: Date
  userMessage: string
}

/**
 * エラーの重要度レベル
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

/**
 * エラー分類
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  DATABASE = "database",
  FILE_SYSTEM = "file_system",
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  PERMISSION = "permission",
  BUSINESS_LOGIC = "business_logic",
  SYSTEM = "system",
  UNKNOWN = "unknown"
}

/**
 * エラー統計情報
 */
interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  lastError?: ErrorDetails
}

/**
 * エラーハンドラーマネージャー
 */
class ErrorHandlerManager {
  private errorStats: ErrorStats = {
    totalErrors: 0,
    errorsByCategory: Object.values(ErrorCategory).reduce(
      (acc, category) => ({ ...acc, [category]: 0 }),
      {}
    ) as Record<ErrorCategory, number>,
    errorsBySeverity: Object.values(ErrorSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {}
    ) as Record<ErrorSeverity, number>
  }

  /**
   * エラーを分類
   */
  private categorizeError(error: Error | AppError | unknown): ErrorCategory {
    if (error instanceof AppError) {
      // カスタムエラーのカテゴリ分類
      if (error.code.includes("VALIDATION")) return ErrorCategory.VALIDATION
      if (error.code.includes("DATABASE") || error.code.includes("PRISMA"))
        return ErrorCategory.DATABASE
      if (error.code.includes("FILE")) return ErrorCategory.FILE_SYSTEM
      if (error.code.includes("NETWORK") || error.code.includes("CONNECTION"))
        return ErrorCategory.NETWORK
      if (error.code.includes("AUTH")) return ErrorCategory.AUTHENTICATION
      if (error.code.includes("PERMISSION")) return ErrorCategory.PERMISSION
    }

    if (error instanceof Error) {
      // 標準エラーのメッセージによる分類
      const message = error.message.toLowerCase()
      if (message.includes("validation") || message.includes("invalid"))
        return ErrorCategory.VALIDATION
      if (message.includes("database") || message.includes("sql")) return ErrorCategory.DATABASE
      if (message.includes("file") || message.includes("enoent") || message.includes("eisdir"))
        return ErrorCategory.FILE_SYSTEM
      if (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("connection")
      )
        return ErrorCategory.NETWORK
      if (message.includes("permission") || message.includes("unauthorized"))
        return ErrorCategory.PERMISSION
    }

    return ErrorCategory.UNKNOWN
  }

  /**
   * エラーの重要度を判定
   */
  private determineSeverity(
    error: Error | AppError | unknown,
    category: ErrorCategory
  ): ErrorSeverity {
    if (error instanceof AppError) {
      // カスタムエラーの重要度設定があれば優先
      if (error.details?.includes("CRITICAL")) return ErrorSeverity.CRITICAL
      if (error.details?.includes("HIGH")) return ErrorSeverity.HIGH
    }

    // カテゴリによる自動判定
    switch (category) {
      case ErrorCategory.SYSTEM:
      case ErrorCategory.DATABASE:
        return ErrorSeverity.HIGH
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.PERMISSION:
        return ErrorSeverity.MEDIUM
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW
      default:
        return ErrorSeverity.MEDIUM
    }
  }

  /**
   * ユーザー向けメッセージを生成
   */
  private generateUserMessage(error: Error | AppError | unknown, category: ErrorCategory): string {
    if (error instanceof AppError) {
      return error.message
    }

    // カテゴリ別のユーザーフレンドリーなメッセージ
    switch (category) {
      case ErrorCategory.VALIDATION:
        return "入力内容に問題があります。内容を確認してください。"
      case ErrorCategory.DATABASE:
        return "データの保存中にエラーが発生しました。しばらく待ってから再試行してください。"
      case ErrorCategory.FILE_SYSTEM:
        return "ファイルの処理中にエラーが発生しました。ファイルの存在と権限を確認してください。"
      case ErrorCategory.NETWORK:
        return "ネットワーク接続に問題があります。インターネット接続を確認してください。"
      case ErrorCategory.AUTHENTICATION:
        return "認証に失敗しました。設定を確認してください。"
      case ErrorCategory.PERMISSION:
        return "必要な権限がありません。管理者権限で実行してください。"
      default:
        return "予期しないエラーが発生しました。しばらく待ってから再試行してください。"
    }
  }

  /**
   * エラー統計を更新
   */
  private updateStats(
    errorDetails: ErrorDetails,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): void {
    this.errorStats.totalErrors++
    this.errorStats.errorsByCategory[category]++
    this.errorStats.errorsBySeverity[severity]++
    this.errorStats.lastError = errorDetails
  }

  /**
   * エラー統計を取得
   */
  getErrorStats(): ErrorStats {
    return { ...this.errorStats }
  }

  /**
   * エラー統計をリセット
   */
  resetStats(): void {
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: Object.values(ErrorCategory).reduce(
        (acc, category) => ({ ...acc, [category]: 0 }),
        {}
      ) as Record<ErrorCategory, number>,
      errorsBySeverity: Object.values(ErrorSeverity).reduce(
        (acc, severity) => ({ ...acc, [severity]: 0 }),
        {}
      ) as Record<ErrorSeverity, number>
    }
  }

  /**
   * 詳細なエラー処理
   */
  processError(error: Error | AppError | unknown, context?: string): ErrorDetails {
    const category = this.categorizeError(error)
    const severity = this.determineSeverity(error, category)
    const userMessage = this.generateUserMessage(error, category)

    let errorCode: string
    let errorMessage: string
    let stack: string | undefined

    if (error instanceof AppError) {
      errorCode = error.code
      errorMessage = error.message
      stack = error.stack
    } else if (error instanceof Error) {
      errorCode = MESSAGES.ERROR.UNEXPECTED
      errorMessage = error.message
      stack = error.stack
    } else {
      errorCode = MESSAGES.ERROR.UNEXPECTED
      errorMessage = String(error)
    }

    const errorDetails: ErrorDetails = {
      code: errorCode,
      message: errorMessage,
      context,
      stack,
      timestamp: new Date(),
      userMessage
    }

    // 統計を更新
    this.updateStats(errorDetails, category, severity)

    // ログ出力（重要度に応じて）
    const logMessage = context ? `${context}: ${errorMessage}` : errorMessage
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(`[${errorCode}] ${logMessage}`, error, { category, severity })
        break
      case ErrorSeverity.MEDIUM:
        logger.warn(`[${errorCode}] ${logMessage}`, { category, severity })
        break
      case ErrorSeverity.LOW:
        logger.info(`[${errorCode}] ${logMessage}`, { category, severity })
        break
    }

    return errorDetails
  }
}

// グローバルエラーハンドラーマネージャー
const errorHandlerManager = new ErrorHandlerManager()

export function createErrorResult(error: Error | AppError | unknown, context?: string): ApiResult {
  const errorDetails = errorHandlerManager.processError(error, context)

  return {
    success: false,
    message: errorDetails.userMessage
  }
}

export function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<ApiResult<T>> {
  return asyncFn()
    .then((result) => ({ success: true, data: result }) as ApiResult<T>)
    .catch((error) => createErrorResult(error, context) as ApiResult<T>)
}

export function createAppError(
  code: keyof typeof MESSAGES.ERROR,
  message: string,
  details?: string
): AppError {
  return new AppError(MESSAGES.ERROR[code], message, details)
}

/**
 * 詳細なエラー情報を含むApiResultを作成
 */
export function createDetailedErrorResult(
  error: Error | AppError | unknown,
  context?: string
): ApiResult & { errorDetails?: ErrorDetails } {
  const errorDetails = errorHandlerManager.processError(error, context)

  return {
    success: false,
    message: errorDetails.userMessage,
    errorDetails
  }
}

/**
 * エラー統計を取得
 */
export function getErrorStats(): ErrorStats {
  return errorHandlerManager.getErrorStats()
}

/**
 * エラー統計をリセット
 */
export function resetErrorStats(): void {
  errorHandlerManager.resetStats()
}

/**
 * 重要度付きのAppErrorを作成
 */
export function createAppErrorWithSeverity(
  code: keyof typeof MESSAGES.ERROR,
  message: string,
  severity: ErrorSeverity,
  details?: string
): AppError {
  const severityTag = `[${severity.toUpperCase()}]`
  const enhancedDetails = details ? `${severityTag} ${details}` : severityTag
  return new AppError(MESSAGES.ERROR[code], message, enhancedDetails)
}

/**
 * リトライ機能付きの非同期エラーハンドリング
 */
export async function handleAsyncErrorWithRetry<T>(
  asyncFn: () => Promise<T>,
  context?: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<ApiResult<T>> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await asyncFn()
      if (attempt > 1) {
        logger.info(`${context}: ${attempt}回目の試行で成功しました`)
      }
      return { success: true, data: result }
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        logger.warn(
          `${context}: ${attempt}回目の試行が失敗しました。${delayMs}ms後に再試行します`,
          error
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        delayMs *= 2 // 指数バックオフ
      }
    }
  }

  logger.error(`${context}: ${maxRetries}回の試行すべてが失敗しました`, lastError)
  return createErrorResult(lastError, context) as ApiResult<T>
}

/**
 * グローバルエラーハンドラーを設定
 */
export function setupGlobalErrorHandlers(): void {
  // 未処理の例外をキャッチ
  process.on("uncaughtException", (error) => {
    logger.error("未処理の例外が発生しました", error)
    // 重要: プロセスを終了させない（Electronアプリケーションのため）
  })

  // 未処理のPromise拒否をキャッチ
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("未処理のPromise拒否が発生しました", reason, { promise })
  })

  logger.info("グローバルエラーハンドラーを設定しました")
}
