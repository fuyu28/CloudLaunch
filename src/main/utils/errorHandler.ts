import { ApiResult } from "../../types/result"
import { logger } from "./logger"
import { MESSAGES } from "../../constants"

export interface ErrorInfo {
  code: string
  message: string
  details?: string
}

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

export function createErrorResult(error: Error | AppError | unknown, context?: string): ApiResult {
  let errorMessage: string
  let errorCode: string

  if (error instanceof AppError) {
    errorMessage = error.message
    errorCode = error.code
  } else if (error instanceof Error) {
    errorMessage = error.message
    errorCode = MESSAGES.ERROR.UNEXPECTED
  } else {
    errorMessage = String(error)
    errorCode = MESSAGES.ERROR.UNEXPECTED
  }

  const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage

  logger.error(`[${errorCode}] ${contextMessage}`)

  return {
    success: false,
    message: errorMessage
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
