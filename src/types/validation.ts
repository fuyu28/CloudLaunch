/**
 * @fileoverview バリデーション関連型定義
 *
 * このファイルは、アプリケーション全体で使用されるバリデーション関連の型を定義します。
 * 主な機能：
 * - バリデーション結果の統一型定義
 * - エラーメッセージの型安全性確保
 * - 汎用的なバリデーション型の提供
 */

/**
 * 単一のバリデーション結果
 */
export interface ValidationResult {
  /** バリデーションが成功したかどうか */
  isValid: boolean
  /** エラーメッセージ（失敗時） */
  message?: string
}

/**
 * 複数のエラーメッセージを持つバリデーション結果
 */
export interface ValidationResultMultiple {
  /** バリデーションが成功したかどうか */
  isValid: boolean
  /** エラーメッセージの配列（失敗時） */
  errors: string[]
}

/**
 * 複数フィールドのバリデーションエラー（汎用型）
 */
export type ValidationErrors<T extends string = string> = {
  [K in T]?: string
}

/**
 * ゲームフォーム専用のバリデーションエラー型
 */
export interface GameFormValidationErrors {
  title?: string
  publisher?: string
  exePath?: string
  saveFolderPath?: string
  imagePath?: string
}

/**
 * 設定フォーム専用のバリデーションエラー型
 */
export interface SettingsFormValidationErrors {
  bucketName?: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
}

/**
 * バリデーション関数の型定義
 */
export type ValidationFunction<T = unknown> = (value: T) => ValidationResult

/**
 * 非同期バリデーション関数の型定義
 */
export type AsyncValidationFunction<T = unknown> = (value: T) => Promise<ValidationResult>

/**
 * フィールドバリデーター型
 */
export interface FieldValidator<T = string> {
  /** フィールド名 */
  field: string
  /** バリデーション関数 */
  validator: ValidationFunction<T>
  /** 必須かどうか */
  required?: boolean
}

/**
 * フォームバリデーター型
 */
export interface FormValidator<T extends Record<string, unknown>> {
  /** フォームデータ */
  data: T
  /** フィールドバリデーターの配列 */
  validators: FieldValidator[]
}

/**
 * バリデーション設定
 */
export interface ValidationConfig {
  /** 必須バリデーションのメッセージテンプレート */
  requiredMessage?: string
  /** 最小長バリデーションのメッセージテンプレート */
  minLengthMessage?: string
  /** 最大長バリデーションのメッセージテンプレート */
  maxLengthMessage?: string
  /** URL形式バリデーションのメッセージテンプレート */
  urlMessage?: string
}
