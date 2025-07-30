/**
 * @fileoverview 共通エラーハンドリング関数
 *
 * このモジュールは、アプリケーション全体で頻繁に発生する
 * エラーパターンに対する統一的な処理を提供します。
 *
 * 主な機能：
 * - Zod検証エラーの統一処理
 * - Prisma制約エラーの統一処理
 * - データベースエンティティ存在確認エラーの統一処理
 */

import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

import type { ApiResult } from "../../types/result"

/**
 * Zod検証エラーを統一的に処理する
 *
 * @param error ZodError オブジェクト
 * @param context エラーが発生したコンテキスト（オプション）
 * @returns ApiResult エラー結果
 */
export function handleZodError(error: ZodError, context?: string): ApiResult {
  const errorMessages = error.issues.map((issue) => issue.message).join(", ")
  const message = context
    ? `${context}: 入力データが無効です: ${errorMessages}`
    : `入力データが無効です: ${errorMessages}`

  return {
    success: false,
    message
  }
}

/**
 * Prisma制約エラーを統一的に処理する
 *
 * @param error Prisma制約エラー
 * @param entityName エンティティ名（例: "ゲーム", "メモ"）
 * @param fieldName フィールド名（オプション）
 * @returns ApiResult エラー結果
 */
export function handlePrismaConstraintError(
  error: Prisma.PrismaClientKnownRequestError,
  entityName: string,
  fieldName?: string
): ApiResult {
  switch (error.code) {
    case "P2002": {
      // Unique constraint failed
      const field = fieldName || "項目"
      return {
        success: false,
        message: `${entityName}の${field}が既に存在します`
      }
    }
    case "P2003": // Foreign key constraint failed
      return {
        success: false,
        message: `関連する${entityName}が見つかりません`
      }
    case "P2025": // Record not found
      return {
        success: false,
        message: `指定された${entityName}が見つかりません`
      }
    default:
      return {
        success: false,
        message: `${entityName}の処理中にデータベースエラーが発生しました`
      }
  }
}

/**
 * データベースエンティティの存在確認エラーを統一的に処理する
 *
 * @param entityName エンティティ名（例: "ゲーム", "メモ"）
 * @param id エンティティのID
 * @returns ApiResult エラー結果
 */
export function handleEntityNotFoundError(entityName: string, id: string): ApiResult {
  return {
    success: false,
    message: `指定された${entityName}（ID: ${id}）が見つかりません`
  }
}

/**
 * ファイル操作エラーを統一的に処理する
 *
 * @param error ファイル操作エラー
 * @param operation 操作名（例: "読み込み", "書き込み", "削除"）
 * @param filePath ファイルパス（オプション）
 * @returns ApiResult エラー結果
 */
export function handleFileOperationError(
  error: Error,
  operation: string,
  filePath?: string
): ApiResult {
  const pathInfo = filePath ? `（${filePath}）` : ""
  return {
    success: false,
    message: `ファイルの${operation}${pathInfo}に失敗しました: ${error.message}`
  }
}

/**
 * 一般的なエラーを統一的に処理する高次関数
 *
 * 複数のエラータイプを自動判定して適切な処理を適用します。
 *
 * @param error 処理対象のエラー
 * @param context エラーが発生したコンテキスト
 * @param entityName エンティティ名（Prismaエラーの場合）
 * @returns ApiResult エラー結果
 */
export function handleCommonError(error: unknown, context: string, entityName?: string): ApiResult {
  // ZodErrorの処理
  if (error instanceof ZodError) {
    return handleZodError(error, context)
  }

  // PrismaClientKnownRequestErrorの処理
  if (error instanceof Prisma.PrismaClientKnownRequestError && entityName) {
    return handlePrismaConstraintError(error, entityName)
  }

  // 標準Errorの処理
  if (error instanceof Error) {
    return {
      success: false,
      message: `${context}: ${error.message}`
    }
  }

  // 不明なエラーの処理
  return {
    success: false,
    message: `${context}: 不明なエラーが発生しました`
  }
}

/**
 * エラーハンドリング付きの非同期関数実行ヘルパー
 *
 * @param asyncFn 実行する非同期関数
 * @param context エラー時のコンテキスト
 * @param entityName エンティティ名（Prismaエラーの場合）
 * @returns Promise<ApiResult<T>> 実行結果
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context: string,
  entityName?: string
): Promise<ApiResult<T>> {
  try {
    const result = await asyncFn()
    return { success: true, data: result }
  } catch (error) {
    return handleCommonError(error, context, entityName) as ApiResult<T>
  }
}
