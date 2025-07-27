/**
 * @fileoverview 汎用Zodバリデーションフック
 *
 * このフックは、任意のZodスキーマを使用したフォームバリデーション機能を提供します。
 *
 * 主な機能：
 * - リアルタイムバリデーション
 * - タッチ状態管理
 * - エラー表示制御
 * - 送信時の全項目バリデーション
 *
 * 使用例：
 * ```tsx
 * const validation = useZodValidation(schema, formData)
 *
 * // 入力変更時
 * const handleChange = (field, value) => {
 *   setFormData(prev => ({ ...prev, [field]: value }))
 *   validation.touch(field)
 * }
 *
 * // エラー表示
 * <input
 *   className={validation.hasError('field') ? 'input-error' : ''}
 *   onChange={(e) => handleChange('field', e.target.value)}
 * />
 * {validation.getError('field') && (
 *   <div className="text-error">{validation.getError('field')}</div>
 * )}
 * ```
 */

import { useState, useCallback, useMemo } from "react"
import { ZodSchema, ZodError } from "zod"

/**
 * バリデーション状態の型定義
 */
export interface ValidationState<T> {
  /** エラーメッセージのマップ */
  errors: Record<keyof T, string | undefined>
  /** タッチされたフィールドのセット */
  touchedFields: Set<keyof T>
  /** バリデーションが有効かどうか */
  isValid: boolean
}

/**
 * Zodバリデーションフックの戻り値の型定義
 */
export interface ZodValidationResult<T> {
  /** 特定フィールドのエラーを取得 */
  getError: (field: keyof T) => string | undefined
  /** 特定フィールドにエラーがあるかチェック */
  hasError: (field: keyof T) => boolean
  /** 特定フィールドをタッチ済みにマーク */
  touch: (field: keyof T) => void
  /** すべてのフィールドをタッチ済みにマーク */
  touchAll: () => void
  /** タッチ状態をリセット */
  resetTouched: () => void
  /** 全体のバリデーション実行 */
  validate: () => { isValid: boolean; errors: Record<keyof T, string> }
  /** 送信可能かどうか */
  canSubmit: boolean
  /** バリデーション状態 */
  state: ValidationState<T>
}

/**
 * 汎用Zodバリデーションフック
 *
 * 任意のZodスキーマとフォームデータを受け取り、
 * バリデーション機能を提供する汎用フックです。
 *
 * @param schema - 使用するZodスキーマ
 * @param data - バリデーション対象のデータ
 * @param options - オプション設定
 * @returns バリデーション結果とヘルパー関数
 */
export function useZodValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  data: T,
  options: {
    /** リアルタイムバリデーションを有効にするか（デフォルト: true） */
    realtime?: boolean
    /** タッチされていないフィールドのエラーも表示するか（デフォルト: false） */
    showUntouchedErrors?: boolean
  } = {}
): ZodValidationResult<T> {
  const { showUntouchedErrors = false } = options

  // タッチされたフィールドの状態
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set())

  // 現在のバリデーション結果
  const validationResult = useMemo(() => {
    try {
      schema.parse(data)
      return { isValid: true, errors: {} as Record<keyof T, string> }
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<keyof T, string> = {} as Record<keyof T, string>
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0] as keyof T
          if (fieldName) {
            errors[fieldName] = issue.message
          }
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: {} as Record<keyof T, string> }
    }
  }, [schema, data])

  // バリデーション状態
  const state: ValidationState<T> = useMemo(() => {
    const displayErrors: Record<keyof T, string | undefined> = {} as Record<
      keyof T,
      string | undefined
    >

    // エラー表示ロジック
    Object.keys(validationResult.errors).forEach((field) => {
      const fieldKey = field as keyof T
      const shouldShow = showUntouchedErrors || touchedFields.has(fieldKey)
      displayErrors[fieldKey] = shouldShow ? validationResult.errors[fieldKey] : undefined
    })

    return {
      errors: displayErrors,
      touchedFields,
      isValid: validationResult.isValid
    }
  }, [validationResult, touchedFields, showUntouchedErrors])

  // 特定フィールドのエラーを取得
  const getError = useCallback(
    (field: keyof T): string | undefined => {
      return state.errors[field]
    },
    [state.errors]
  )

  // 特定フィールドにエラーがあるかチェック
  const hasError = useCallback(
    (field: keyof T): boolean => {
      return !!state.errors[field]
    },
    [state.errors]
  )

  // 特定フィールドをタッチ済みにマーク
  const touch = useCallback((field: keyof T) => {
    setTouchedFields((prev) => new Set([...prev, field]))
  }, [])

  // すべてのフィールドをタッチ済みにマーク
  const touchAll = useCallback(() => {
    const allFields = Object.keys(data) as (keyof T)[]
    setTouchedFields(new Set(allFields))
  }, [data])

  // タッチ状態をリセット
  const resetTouched = useCallback(() => {
    setTouchedFields(new Set())
  }, [])

  // 全体のバリデーション実行
  const validate = useCallback(() => {
    touchAll()
    return validationResult
  }, [touchAll, validationResult])

  // 送信可能かどうか
  const canSubmit = useMemo(() => {
    return validationResult.isValid
  }, [validationResult.isValid])

  return {
    getError,
    hasError,
    touch,
    touchAll,
    resetTouched,
    validate,
    canSubmit,
    state
  }
}

export default useZodValidation
