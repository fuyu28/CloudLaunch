/**
 * @fileoverview Zodベースのゲームフォームバリデーションフック
 *
 * このフックは、ゲーム登録・編集フォームのバリデーション機能を提供します。
 * Zodスキーマを使用して型安全かつ保守可能なバリデーションを実現します。
 *
 * 主な機能：
 * - Zodスキーマベースの検証
 * - リアルタイムバリデーション
 * - エラーメッセージの自動生成
 * - 送信可能状態の判定
 *
 * 使用例：
 * ```tsx
 * const { canSubmit, errors, validateField } = useGameFormValidationZod(gameData)
 * ```
 */

import { useMemo, useState, useCallback, useEffect } from "react"
import { gameFormSchema, gameFormWithFileCheckSchema } from "../../../schemas/game"
import type { InputGameData } from "../../../types/game"
import { ZodError } from "zod"

/**
 * バリデーションエラーの型定義
 */
export interface ValidationErrors {
  title?: string
  publisher?: string
  exePath?: string
  imagePath?: string
  saveFolderPath?: string
}

/**
 * ゲームフォームバリデーションフックの戻り値
 */
export interface GameFormValidationResult {
  /** 送信可能かどうか */
  canSubmit: boolean
  /** バリデーションエラー（タッチされたフィールドのみ表示） */
  errors: ValidationErrors
  /** 特定フィールドのバリデーション実行 */
  validateField: (fieldName: keyof InputGameData) => string | undefined
  /** 全フィールドのバリデーション実行 */
  validateAllFields: () => { isValid: boolean; errors: Record<string, string> }
  /** ファイル存在チェックを含む非同期バリデーション */
  validateAllFieldsWithFileCheck: () => Promise<{
    isValid: boolean
    errors: Record<string, string>
  }>
  /** 必須フィールドがすべて入力されているかチェック */
  hasRequiredFields: boolean
  /** 各フィールドの検証状態 */
  fieldValidation: Record<
    keyof InputGameData,
    { isValid: boolean; message?: string; shouldShowError: boolean }
  >
  /** フィールドがタッチされたことを記録 */
  markFieldAsTouched: (fieldName: keyof InputGameData) => void
  /** すべてのフィールドをタッチ済みとして設定（送信時に使用） */
  markAllFieldsAsTouched: () => void
  /** タッチされたフィールドをリセット（モーダル開閉時に使用） */
  resetTouchedFields: () => void
}

/**
 * Zodベースのゲームフォームバリデーションフック
 *
 * ゲーム登録・編集フォームのバリデーション機能を提供します。
 * Zodスキーマを使用して型安全なバリデーションを実現します。
 *
 * @param gameData 検証対象のゲームデータ
 * @returns バリデーション結果とヘルパー関数
 */
export function useGameFormValidationZod(gameData: InputGameData): GameFormValidationResult {
  // タッチされたフィールドを記録する状態
  const [touchedFields, setTouchedFields] = useState<Set<keyof InputGameData>>(new Set())

  // ファイル存在チェックエラーの状態
  const [fileCheckErrors, setFileCheckErrors] = useState<Record<string, string>>({})

  // gameDataの変更を監視してファイル存在チェックを自動実行
  useEffect(() => {
    const fileFields = ["exePath", "imagePath", "saveFolderPath"] as const
    const hasFileValues = fileFields.some((field) => {
      const value = gameData[field] as string
      return value && value.trim() !== ""
    })

    if (hasFileValues) {
      // デバウンスされたファイル存在チェック（500ms後に実行）
      const timeoutId = setTimeout(async () => {
        try {
          await gameFormWithFileCheckSchema.parseAsync(gameData)
          // バリデーション成功時はエラーをクリア
          setFileCheckErrors({})
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMap: Record<string, string> = {}
            error.issues.forEach((issue) => {
              const fieldName = issue.path[0]
              if (fieldName && typeof fieldName === "string") {
                errorMap[fieldName] = issue.message
              }
            })
            setFileCheckErrors(errorMap)
          }
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      // すべてのファイルフィールドが空の場合はエラーをクリア
      setFileCheckErrors({})
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData.exePath, gameData.imagePath, gameData.saveFolderPath])

  // フィールドをタッチ済みとして記録
  const markFieldAsTouched = useCallback((fieldName: keyof InputGameData) => {
    setTouchedFields((prev) => new Set([...prev, fieldName]))
  }, [])

  // すべてのフィールドをタッチ済みとして設定
  const markAllFieldsAsTouched = useCallback(() => {
    setTouchedFields(new Set(["title", "publisher", "exePath", "imagePath", "saveFolderPath"]))
  }, [])

  // タッチされたフィールドをリセット
  const resetTouchedFields = useCallback(() => {
    setTouchedFields(new Set())
    setFileCheckErrors({})
  }, [])

  /**
   * Zodスキーマを使用したフィールドバリデーション
   * 個別フィールドの検証を実行し、エラーメッセージを返す
   * 全体スキーマを使用してrefineバリデーションも適用
   */
  const validateField = useCallback(
    (fieldName: keyof InputGameData): string | undefined => {
      try {
        // 全体スキーマで検証し、指定フィールドのエラーのみを取得
        gameFormSchema.parse(gameData)
        return undefined
      } catch (error) {
        if (error instanceof ZodError) {
          // 指定フィールドに関連するエラーのみを返す
          const fieldError = error.issues.find((issue) => issue.path.includes(fieldName))
          return fieldError?.message
        }
        return "入力値が無効です"
      }
    },
    [gameData]
  )

  /**
   * 全フィールドのバリデーション結果を取得
   * Zodスキーマの全体検証を実行
   */
  const validateAllFields = useCallback(() => {
    try {
      gameFormSchema.parse(gameData)
      return { isValid: true, errors: {} }
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMap: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName && typeof fieldName === "string") {
            errorMap[fieldName] = issue.message
          }
        })
        return { isValid: false, errors: errorMap }
      }
      return { isValid: false, errors: { general: "バリデーションエラーが発生しました" } }
    }
  }, [gameData])

  /**
   * ファイル存在チェックを含む非同期バリデーション
   * フォーム送信時の最終バリデーションで使用
   */
  const validateAllFieldsWithFileCheck = useCallback(async () => {
    try {
      // Zodスキーマでファイル存在チェックを含む全体バリデーションを実行
      await gameFormWithFileCheckSchema.parseAsync(gameData)

      // バリデーション成功時はファイルチェックエラーをクリア
      setFileCheckErrors({})
      return { isValid: true, errors: {} }
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMap: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName && typeof fieldName === "string") {
            errorMap[fieldName] = issue.message
          }
        })

        // ファイル存在チェックエラーをstateに保存
        setFileCheckErrors(errorMap)
        return { isValid: false, errors: errorMap }
      }
      return { isValid: false, errors: { general: "バリデーションエラーが発生しました" } }
    }
  }, [gameData])

  // 各フィールドのバリデーション状態（Zodベース）
  const fieldValidation = useMemo(() => {
    const fieldNames: (keyof InputGameData)[] = [
      "title",
      "publisher",
      "exePath",
      "imagePath",
      "saveFolderPath"
    ]

    return fieldNames.reduce(
      (acc, fieldName) => {
        const zodErrorMessage = validateField(fieldName)
        const fileCheckError = fileCheckErrors[fieldName]

        // Zodエラーまたはファイル存在チェックエラーのいずれかを使用
        const errorMessage = zodErrorMessage || fileCheckError
        const isValid = !errorMessage
        const shouldShowError = touchedFields.has(fieldName) && !!errorMessage

        acc[fieldName] = {
          isValid,
          message: errorMessage,
          shouldShowError
        }
        return acc
      },
      {} as Record<
        keyof InputGameData,
        { isValid: boolean; message?: string; shouldShowError: boolean }
      >
    )
  }, [touchedFields, validateField, fileCheckErrors])

  // エラーオブジェクトの生成（タッチされたフィールドのみ）
  const errors = useMemo((): ValidationErrors => {
    return {
      title: fieldValidation.title?.shouldShowError ? fieldValidation.title.message : undefined,
      publisher: fieldValidation.publisher?.shouldShowError
        ? fieldValidation.publisher.message
        : undefined,
      exePath: fieldValidation.exePath?.shouldShowError
        ? fieldValidation.exePath.message
        : undefined,
      imagePath: fieldValidation.imagePath?.shouldShowError
        ? fieldValidation.imagePath.message
        : undefined,
      saveFolderPath: fieldValidation.saveFolderPath?.shouldShowError
        ? fieldValidation.saveFolderPath.message
        : undefined
    }
  }, [fieldValidation])

  // 必須フィールドの入力チェック（Zodベース）
  const hasRequiredFields = useMemo(() => {
    return (
      fieldValidation.title?.isValid &&
      fieldValidation.publisher?.isValid &&
      fieldValidation.exePath?.isValid
    )
  }, [fieldValidation])

  // 送信可能状態の判定（Zodスキーマでの全体検証＋ファイル存在チェック）
  const canSubmit = useMemo(() => {
    const validationResult = validateAllFields()
    const hasFileCheckErrors = Object.keys(fileCheckErrors).length > 0
    return validationResult.isValid && !hasFileCheckErrors
  }, [validateAllFields, fileCheckErrors])

  return {
    canSubmit,
    errors,
    validateField,
    validateAllFields,
    validateAllFieldsWithFileCheck,
    hasRequiredFields,
    fieldValidation,
    markFieldAsTouched,
    markAllFieldsAsTouched,
    resetTouchedFields
  }
}

export default useGameFormValidationZod
