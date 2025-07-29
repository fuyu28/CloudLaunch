/**
 * @fileoverview バリデーションユーティリティ
 *
 * このファイルは、アプリケーション全体で使用されるバリデーション関数を提供します。
 * 主な機能：
 * - 基本的な入力値検証
 * - URL・エンドポイント検証
 * - 認証情報の検証
 * - 複数の検証結果の合成
 */

/**
 * バリデーション結果の型定義
 */
export type ValidationResult = {
  /** 検証が成功したかどうか */
  isValid: boolean
  /** エラーメッセージ（失敗時） */
  message?: string
}

/**
 * 複数のフィールドのバリデーションエラー
 */
export type ValidationErrors = {
  [fieldName: string]: string | undefined
}

/**
 * 必須入力項目の検証
 * @param value - 検証する値
 * @param fieldName - フィールド名（エラーメッセージ用）
 * @returns 検証結果
 */
export function validateRequired(
  value: string | undefined | undefined,
  fieldName: string
): ValidationResult {
  const isValid = typeof value === "string" && value.trim().length > 0
  return {
    isValid,
    message: isValid ? undefined : `${fieldName}は必須項目です`
  }
}

/**
 * 最小文字数の検証
 * @param value - 検証する値
 * @param minLength - 最小文字数
 * @param fieldName - フィールド名（エラーメッセージ用）
 * @returns 検証結果
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationResult {
  const isValid = value.length >= minLength
  return {
    isValid,
    message: isValid ? undefined : `${fieldName}は${minLength}文字以上で入力してください`
  }
}

/**
 * 最大文字数の検証
 * @param value - 検証する値
 * @param maxLength - 最大文字数
 * @param fieldName - フィールド名（エラーメッセージ用）
 * @returns 検証結果
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationResult {
  const isValid = value.length <= maxLength
  return {
    isValid,
    message: isValid ? undefined : `${fieldName}は${maxLength}文字以内で入力してください`
  }
}

/**
 * URLの検証
 * @param url - 検証するURL
 * @param fieldName - フィールド名（エラーメッセージ用）
 * @returns 検証結果
 */
export function validateUrl(url: string, fieldName: string): ValidationResult {
  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return {
      isValid: false,
      message: `${fieldName}は有効なURLを入力してください`
    }
  }
}

/**
 * R2またはS3エンドポイントの検証
 * @param endpoint - 検証するエンドポイント
 * @returns 検証結果
 */
export function validateR2OrS3Endpoint(endpoint: string): ValidationResult {
  // 基本的なURL検証
  const urlValidation = validateUrl(endpoint, "エンドポイント")
  if (!urlValidation.isValid) {
    return urlValidation
  }

  // HTTPSの確認
  if (!endpoint.startsWith("https://")) {
    return {
      isValid: false,
      message: "エンドポイントはHTTPSで始まる必要があります"
    }
  }

  // R2またはS3の一般的なパターンチェック
  const r2Pattern = /^https:\/\/[a-zA-Z0-9.-]+\.r2\.cloudflarestorage\.com$/
  const s3Pattern =
    /^https:\/\/s3[.-][a-zA-Z0-9.-]*\.amazonaws\.com$|^https:\/\/[a-zA-Z0-9.-]+\.s3[.-][a-zA-Z0-9.-]*\.amazonaws\.com$/
  const customEndpointPattern = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  if (
    r2Pattern.test(endpoint) ||
    s3Pattern.test(endpoint) ||
    customEndpointPattern.test(endpoint)
  ) {
    return { isValid: true }
  }

  return {
    isValid: false,
    message: "有効なR2またはS3エンドポイントを入力してください"
  }
}

/**
 * 複数の検証結果を統合
 * @param results - 検証結果の配列
 * @returns 統合された検証結果
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  const failedResult = results.find((result) => !result.isValid)
  if (failedResult) {
    return failedResult
  }
  return { isValid: true }
}

/**
 * ValidationErrorsオブジェクトにエラーがあるかチェック
 * @param errors - バリデーションエラーオブジェクト
 * @returns エラーがある場合 true
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined)
}

/**
 * ValidationErrorsから最初のエラーメッセージを取得
 * @param errors - バリデーションエラーオブジェクト
 * @returns 最初のエラーメッセージ、なければ undefined
 */
export function getFirstErrorMessage(errors: ValidationErrors): string | undefined {
  const errorValues = Object.values(errors)
  return errorValues.find((error) => error !== undefined)
}
