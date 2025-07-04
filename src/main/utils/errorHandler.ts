import { ApiResult } from "../../types/result"
import { logger } from "./logger"

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
    errorCode = "UNKNOWN_ERROR"
  } else {
    errorMessage = String(error)
    errorCode = "UNKNOWN_ERROR"
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

export const ERROR_CODES = {
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SPAWN_ERROR: "SPAWN_ERROR",
  CREDENTIAL_ERROR: "CREDENTIAL_ERROR"
} as const

export function createAppError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: string
): AppError {
  return new AppError(ERROR_CODES[code], message, details)
}
