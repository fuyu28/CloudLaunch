/**
 * @fileoverview IPCハンドラー共通ヘルパー関数
 *
 * このファイルは、IPCハンドラーで頻繁に使用される共通パターンを
 * ヘルパー関数として提供します。
 *
 * 主な機能：
 * - サービス結果のレスポンス変換
 * - エラーハンドリング付きハンドラー作成
 * - 型安全なパラメータ検証
 */

import { logger } from "./logger"
import type { ApiResult } from "../../types/result"

/**
 * サービス結果を単純な値に変換するヘルパー
 *
 * @param result サービスの実行結果
 * @param fallback エラー時のフォールバック値
 * @returns 成功時はdata、失敗時はfallback
 */
export function extractDataOrFallback<T>(result: ApiResult<T>, fallback: T): T {
  return result.success ? result.data! : fallback
}

/**
 * サービス結果を配列形式で安全に取得するヘルパー
 *
 * @param result サービスの実行結果
 * @returns 成功時は配列、失敗時は空配列
 */
export function extractDataOrEmptyArray<T>(result: ApiResult<T[]>): T[] {
  return extractDataOrFallback(result, [])
}

/**
 * サービス結果をオプショナル値として取得するヘルパー
 *
 * @param result サービスの実行結果
 * @returns 成功時はdata、失敗時はundefined
 */
export function extractDataOrUndefined<T>(result: ApiResult<T | null>): T | undefined {
  return result.success ? result.data || undefined : undefined
}

/**
 * 非同期サービス関数をIPCハンドラーでラップするヘルパー
 *
 * @param serviceFn サービス関数
 * @param context エラー時のコンテキスト
 * @returns ラップされたハンドラー関数
 */
export function wrapServiceCall<TArgs extends unknown[], TResult>(
  serviceFn: (...args: TArgs) => Promise<ApiResult<TResult>>,
  context: string
) {
  return async (...args: TArgs): Promise<ApiResult<TResult>> => {
    try {
      return await serviceFn(...args)
    } catch (error) {
      logger.error(`${context}エラー:`, error)
      return {
        success: false,
        message: `${context}に失敗しました`
      }
    }
  }
}

/**
 * 単純な値を返すサービス関数をラップするヘルパー
 *
 * @param serviceFn サービス関数
 * @param fallback エラー時のフォールバック値
 * @param context エラー時のコンテキスト
 * @returns ラップされたハンドラー関数
 */
export function wrapSimpleServiceCall<TArgs extends unknown[], TResult>(
  serviceFn: (...args: TArgs) => Promise<ApiResult<TResult>>,
  fallback: TResult,
  context: string
) {
  return async (...args: TArgs): Promise<TResult> => {
    const wrappedFn = wrapServiceCall(serviceFn, context)
    const result = await wrappedFn(...args)
    return extractDataOrFallback(result, fallback)
  }
}

/**
 * パラメータ検証を含むIPCハンドラーを作成するヘルパー
 *
 * @param validator パラメータ検証関数
 * @param handler 実際の処理を行うハンドラー
 * @param context エラー時のコンテキスト
 * @returns 検証付きハンドラー関数
 */
export function createValidatedHandler<TArgs extends unknown[], TResult>(
  validator: (...args: TArgs) => boolean | string,
  handler: (...args: TArgs) => Promise<TResult>,
  context: string
) {
  return async (...args: TArgs): Promise<TResult | ApiResult> => {
    const validationResult = validator(...args)

    if (validationResult !== true) {
      const errorMessage =
        typeof validationResult === "string" ? validationResult : `${context}のパラメータが不正です`

      logger.warn(`${context}パラメータ検証エラー:`, { args, error: errorMessage })

      // ApiResultを返すべきかTResultを返すべきかは呼び出し側で判断
      return {
        success: false,
        message: errorMessage
      } as ApiResult
    }

    try {
      return await handler(...args)
    } catch (error) {
      logger.error(`${context}実行エラー:`, error)
      return {
        success: false,
        message: `${context}の実行に失敗しました`
      } as ApiResult
    }
  }
}

/**
 * 文字列の空白チェック
 *
 * @param value チェック対象の文字列
 * @returns 有効な文字列かどうか
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * IDパラメータの検証
 *
 * @param id 検証対象のID
 * @returns 検証結果（trueまたはエラーメッセージ）
 */
export function validateId(id: unknown): boolean | string {
  if (!isNonEmptyString(id)) {
    return "IDが指定されていません"
  }

  // UUID形式の簡易チェック（必要に応じて強化）
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(id)) {
    return "不正なID形式です"
  }

  return true
}

/**
 * 複数のIDパラメータを検証
 *
 * @param ids 検証対象のIDリスト
 * @returns 検証結果（trueまたはエラーメッセージ）
 */
export function validateIds(...ids: unknown[]): boolean | string {
  for (let i = 0; i < ids.length; i++) {
    const validationResult = validateId(ids[i])
    if (validationResult !== true) {
      return `${i + 1}番目のパラメータ: ${validationResult}`
    }
  }
  return true
}

/**
 * オブジェクトが必須プロパティを持っているかチェック
 *
 * @param obj チェック対象のオブジェクト
 * @param requiredProps 必須プロパティ名の配列
 * @returns 検証結果（trueまたはエラーメッセージ）
 */
export function validateRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  requiredProps: (keyof T)[]
): boolean | string {
  if (!obj || typeof obj !== "object") {
    return "オブジェクトが指定されていません"
  }

  const typedObj = obj as T
  for (const prop of requiredProps) {
    if (!(prop in typedObj) || typedObj[prop] === null || typedObj[prop] === undefined) {
      return `必須プロパティ '${String(prop)}' が不正です`
    }
  }

  return true
}
