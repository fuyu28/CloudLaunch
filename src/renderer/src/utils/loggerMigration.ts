/**
 * @fileoverview ログ移行用ヘルパー
 *
 * 既存のconsole.*呼び出しを新しいログシステムに移行するためのヘルパー関数
 */

import { logger } from "./logger"

/**
 * 既存のconsole.error呼び出しを新しいログシステムに置き換える
 */
export function migrateConsoleError(
  message: string,
  error: unknown,
  component: string,
  functionName?: string,
  data?: unknown
): void {
  logger.error(message, {
    component,
    function: functionName,
    error: error instanceof Error ? error : new Error(String(error)),
    data
  })
}

/**
 * 既存のconsole.warn呼び出しを新しいログシステムに置き換える
 */
export function migrateConsoleWarn(
  message: string,
  data: unknown,
  component: string,
  functionName?: string
): void {
  logger.warn(message, {
    component,
    function: functionName,
    data
  })
}

/**
 * 既存のconsole.log呼び出しを新しいログシステムに置き換える（開発環境のみ）
 */
export function migrateConsoleLog(
  message: string,
  data: unknown,
  component: string,
  functionName?: string
): void {
  if (process.env.NODE_ENV === "development") {
    logger.debug(message, {
      component,
      function: functionName,
      data
    })
  }
}

/**
 * ユーザーアクションのログを記録
 */
export function logUserAction(
  action: string,
  component: string,
  details?: Record<string, unknown>
): void {
  logger.logUserAction(`${component}: ${action}`, details)
}
