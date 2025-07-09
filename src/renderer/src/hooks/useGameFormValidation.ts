/**
 * @fileoverview ゲームフォームバリデーションフック
 *
 * このフックは、ゲーム登録・編集フォームのバリデーション機能を提供します。
 *
 * 主な機能：
 * - 必須フィールドの検証
 * - リアルタイムバリデーション
 * - エラーメッセージの生成
 * - 送信可能状態の判定
 *
 * 使用例：
 * ```tsx
 * const { canSubmit, errors, validateField } = useGameFormValidation(gameData)
 * ```
 */

import { useMemo, useState, useCallback, useEffect } from "react"
import type { InputGameData } from "../../../types/game"

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
  /** 必須フィールドがすべて入力されているかチェック */
  hasRequiredFields: boolean
  /** 各フィールドの検証状態 */
  fieldValidation: {
    title: { isValid: boolean; message?: string; shouldShowError: boolean }
    publisher: { isValid: boolean; message?: string; shouldShowError: boolean }
    exePath: { isValid: boolean; message?: string; shouldShowError: boolean }
    imagePath: { isValid: boolean; message?: string; shouldShowError: boolean }
    saveFolderPath: { isValid: boolean; message?: string; shouldShowError: boolean }
  }
  /** フィールドがタッチされたことを記録 */
  markFieldAsTouched: (fieldName: keyof InputGameData) => void
  /** すべてのフィールドをタッチ済みとして設定（送信時に使用） */
  markAllFieldsAsTouched: () => void
  /** タッチされたフィールドをリセット（モーダル開閉時に使用） */
  resetTouchedFields: () => void
}

/**
 * ゲームフォームバリデーションフック
 *
 * ゲーム登録・編集フォームのバリデーション機能を提供します。
 *
 * @param gameData 検証対象のゲームデータ
 * @returns バリデーション結果とヘルパー関数
 */
export function useGameFormValidation(gameData: InputGameData): GameFormValidationResult {
  // タッチされたフィールドを記録する状態
  const [touchedFields, setTouchedFields] = useState<Set<keyof InputGameData>>(new Set())

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
  }, [])
  // 個別フィールドのバリデーション
  const validateTitle = (title: string): string | undefined => {
    if (!title.trim()) {
      return "タイトルは必須です"
    }
    if (title.length > 100) {
      return "タイトルは100文字以内で入力してください"
    }
    return undefined
  }

  const validatePublisher = (publisher: string): string | undefined => {
    if (!publisher.trim()) {
      return "ブランドは必須です"
    }
    if (publisher.length > 50) {
      return "ブランドは50文字以内で入力してください"
    }
    return undefined
  }

  const validateExePath = (exePath: string): string | undefined => {
    if (!exePath.trim()) {
      return "実行ファイルの場所は必須です"
    }
    // 実行ファイルの拡張子チェック（基本的な検証）
    if (![".exe", ".app"].some((ext) => exePath.toLowerCase().endsWith(ext))) {
      return "実行ファイル（.exe または .app）を指定してください"
    }
    return undefined
  }

  const validateImagePath = (imagePath: string | undefined): string | undefined => {
    if (imagePath && imagePath.trim()) {
      // 画像ファイルの拡張子チェック
      const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
      if (!imageExtensions.some((ext) => imagePath.toLowerCase().endsWith(ext))) {
        return "画像ファイル（PNG、JPG、GIF等）を指定してください"
      }
    }
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateSaveFolderPath = (_saveFolderPath: string | undefined): string | undefined => {
    // セーブフォルダパスは任意項目のため、エラーなし
    return undefined
  }

  // フィールドバリデーション関数
  const validateField = (fieldName: keyof InputGameData): string | undefined => {
    switch (fieldName) {
      case "title":
        return validateTitle(gameData.title)
      case "publisher":
        return validatePublisher(gameData.publisher)
      case "exePath":
        return validateExePath(gameData.exePath)
      case "imagePath":
        return validateImagePath(gameData.imagePath)
      case "saveFolderPath":
        return validateSaveFolderPath(gameData.saveFolderPath)
      default:
        return undefined
    }
  }

  // 各フィールドのバリデーション状態
  const fieldValidation = useMemo(() => {
    return {
      title: {
        isValid: !validateTitle(gameData.title),
        message: validateTitle(gameData.title),
        shouldShowError: touchedFields.has("title") && !!validateTitle(gameData.title)
      },
      publisher: {
        isValid: !validatePublisher(gameData.publisher),
        message: validatePublisher(gameData.publisher),
        shouldShowError: touchedFields.has("publisher") && !!validatePublisher(gameData.publisher)
      },
      exePath: {
        isValid: !validateExePath(gameData.exePath),
        message: validateExePath(gameData.exePath),
        shouldShowError: touchedFields.has("exePath") && !!validateExePath(gameData.exePath)
      },
      imagePath: {
        isValid: !validateImagePath(gameData.imagePath),
        message: validateImagePath(gameData.imagePath),
        shouldShowError: touchedFields.has("imagePath") && !!validateImagePath(gameData.imagePath)
      },
      saveFolderPath: {
        isValid: !validateSaveFolderPath(gameData.saveFolderPath),
        message: validateSaveFolderPath(gameData.saveFolderPath),
        shouldShowError:
          touchedFields.has("saveFolderPath") && !!validateSaveFolderPath(gameData.saveFolderPath)
      }
    }
  }, [gameData, touchedFields])

  // エラーオブジェクトの生成（タッチされたフィールドのみ）
  const errors = useMemo((): ValidationErrors => {
    return {
      title: fieldValidation.title.shouldShowError ? fieldValidation.title.message : undefined,
      publisher: fieldValidation.publisher.shouldShowError
        ? fieldValidation.publisher.message
        : undefined,
      exePath: fieldValidation.exePath.shouldShowError
        ? fieldValidation.exePath.message
        : undefined,
      imagePath: fieldValidation.imagePath.shouldShowError
        ? fieldValidation.imagePath.message
        : undefined,
      saveFolderPath: fieldValidation.saveFolderPath.shouldShowError
        ? fieldValidation.saveFolderPath.message
        : undefined
    }
  }, [fieldValidation])

  // 必須フィールドの入力チェック
  const hasRequiredFields = useMemo(() => {
    return (
      fieldValidation.title.isValid &&
      fieldValidation.publisher.isValid &&
      fieldValidation.exePath.isValid
    )
  }, [fieldValidation])

  // 送信可能状態の判定
  const canSubmit = useMemo(() => {
    return (
      hasRequiredFields &&
      fieldValidation.imagePath.isValid &&
      fieldValidation.saveFolderPath.isValid
    )
  }, [hasRequiredFields, fieldValidation.imagePath.isValid, fieldValidation.saveFolderPath.isValid])

  return {
    canSubmit,
    errors,
    validateField,
    hasRequiredFields,
    fieldValidation,
    markFieldAsTouched,
    markAllFieldsAsTouched,
    resetTouchedFields
  }
}

export default useGameFormValidation
