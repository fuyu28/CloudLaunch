/**
 * @fileoverview 共通バリデーションスキーマとユーティリティ
 *
 * インポート・エクスポート・データベース操作で共通使用されるスキーマを定義
 * バリデーションエラーメッセージの統一と型安全性を提供
 */

import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { z } from "zod"

// =============================================================================
// 共通定数とエラーメッセージ
// =============================================================================

export const VALIDATION_MESSAGES = {
  REQUIRED_UUID: "有効なUUID形式である必要があります",
  REQUIRED_STRING: "必須の文字列項目です",
  INVALID_PATH: "不正なパス（相対パス）は使用できません",
  MAX_LENGTH: (max: number) => `${max}文字以内で入力してください`,
  MIN_VALUE: (min: number) => `${min}以上である必要があります`,
  EMPTY_PATH: "ファイルパスが空です",
  INVALID_DATE: "有効な日時形式である必要があります"
} as const

// プレイステータスの共通定義
export const PLAY_STATUS_VALUES = ["unplayed", "playing", "played"] as const
export type PlayStatusType = (typeof PLAY_STATUS_VALUES)[number]

// インポート・エクスポート形式の共通定義
export const EXPORT_FORMATS = ["json", "csv", "sql"] as const
export const IMPORT_MODES = ["skip", "replace", "merge"] as const

export type ExportFormat = (typeof EXPORT_FORMATS)[number]
export type ImportMode = (typeof IMPORT_MODES)[number]

// =============================================================================
// 基本スキーマ定義
// =============================================================================

/**
 * UUID形式のバリデーションスキーマ
 */
export const UuidSchema = z.uuid(VALIDATION_MESSAGES.REQUIRED_UUID)

/**
 * ファイルパスのバリデーションスキーマ
 */
export const FilePathSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.EMPTY_PATH)
  .refine((path) => !path.includes(".."), VALIDATION_MESSAGES.INVALID_PATH)

/**
 * プレイステータスのスキーマ
 */
export const PlayStatusSchema = z.enum(PLAY_STATUS_VALUES)

/**
 * 検索キーワードのスキーマ
 */
export const SearchWordSchema = z.string().max(255, VALIDATION_MESSAGES.MAX_LENGTH(255))

/**
 * プレイ時間（秒）のスキーマ
 */
export const PlayTimeSchema = z.number().min(0, VALIDATION_MESSAGES.MIN_VALUE(0))

// =============================================================================
// Date型 vs String型の統合スキーマ
// =============================================================================

/**
 * Date型またはISO文字列を受け入れる柔軟なスキーマ
 * エクスポート時（Date型）とインポート時（string型）の両方に対応
 */
export const FlexibleDateSchema = z
  .union([z.date(), z.string().min(1, VALIDATION_MESSAGES.INVALID_DATE)])
  .transform((val) => {
    if (val instanceof Date) {
      return val
    }
    // 文字列の場合はDate型に変換を試行
    const parsed = new Date(val)
    if (isNaN(parsed.getTime())) {
      throw new Error(VALIDATION_MESSAGES.INVALID_DATE)
    }
    return parsed
  })

/**
 * null許可の柔軟なDateスキーマ
 */
export const FlexibleDateNullableSchema = z.union([FlexibleDateSchema, z.null()])

// =============================================================================
// 共通レコードスキーマ（インポート・エクスポート統合）
// =============================================================================

/**
 * ゲームレコードの統合スキーマ
 * インポート・エクスポート両方で使用可能
 */
export const GameRecordSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1, "タイトルは必須です").max(255, VALIDATION_MESSAGES.MAX_LENGTH(255)),
  publisher: z.string().max(255, VALIDATION_MESSAGES.MAX_LENGTH(255)).nullable(),
  imagePath: z.string().nullable(),
  exePath: FilePathSchema,
  saveFolderPath: z.string().nullable(),
  createdAt: FlexibleDateSchema.optional(),
  playStatus: PlayStatusSchema.default("unplayed"),
  totalPlayTime: PlayTimeSchema.default(0),
  lastPlayed: FlexibleDateNullableSchema.optional(),
  clearedAt: FlexibleDateNullableSchema.optional(),
  currentChapter: z.string().nullable()
})

/**
 * プレイセッションレコードの統合スキーマ
 */
export const PlaySessionRecordSchema = z.object({
  id: UuidSchema,
  gameId: UuidSchema,
  playedAt: FlexibleDateSchema.default(() => new Date()),
  duration: PlayTimeSchema.default(0),
  sessionName: z.string().nullable(),
  chapterId: UuidSchema.nullable(),
  uploadId: UuidSchema.nullable()
})

/**
 * アップロードレコードの統合スキーマ
 */
export const UploadRecordSchema = z.object({
  id: UuidSchema,
  gameId: UuidSchema,
  clientId: z.string().nullable(),
  comment: z.string().default(""),
  createdAt: FlexibleDateSchema.default(() => new Date())
})

/**
 * チャプターレコードの統合スキーマ
 */
export const ChapterRecordSchema = z.object({
  id: UuidSchema,
  gameId: UuidSchema,
  name: z.string().min(1, "チャプター名は必須です"),
  order: z.number().min(0, VALIDATION_MESSAGES.MIN_VALUE(0)).default(0),
  createdAt: FlexibleDateSchema.default(() => new Date())
})

/**
 * メモレコードの統合スキーマ
 */
export const MemoRecordSchema = z.object({
  id: UuidSchema,
  gameId: UuidSchema,
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().default(""),
  createdAt: FlexibleDateSchema.default(() => new Date()),
  updatedAt: FlexibleDateSchema.default(() => new Date())
})

// =============================================================================
// インポート・エクスポート全体スキーマ
// =============================================================================

/**
 * エクスポートデータ全体のスキーマ
 */
export const ExportDataSchema = z.object({
  exportedAt: z.string(),
  version: z.string().default("1.0"),
  data: z.object({
    games: z.array(GameRecordSchema).optional(),
    playSessions: z.array(PlaySessionRecordSchema).optional(),
    uploads: z.array(UploadRecordSchema).optional(),
    chapters: z.array(ChapterRecordSchema).optional(),
    memos: z.array(MemoRecordSchema).optional()
  })
})

// =============================================================================
// バリデーション結果の型定義
// =============================================================================

export type ValidationResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      errors: Array<{
        path: string
        message: string
        code: string
      }>
    }

// =============================================================================
// 汎用バリデーション関数
// =============================================================================

/**
 * 汎用バリデーション関数
 * @param schema zodスキーマ
 * @param data バリデーション対象のデータ
 * @param context エラー時のコンテキスト情報
 * @returns バリデーション結果
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context = "data"
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const errors = result.error.issues.map((err) => ({
      path: `${context}.${err.path.join(".")}`,
      message: err.message,
      code: err.code
    }))
    return { success: false, errors }
  }
}

/**
 * 配列データのバリデーション関数
 * @param schema 要素のzodスキーマ
 * @param dataArray バリデーション対象の配列
 * @param context エラー時のコンテキスト情報
 * @returns バリデーション結果
 */
export function validateArrayData<T>(
  schema: z.ZodType<T>,
  dataArray: unknown[],
  context = "array"
): ValidationResult<T[]> {
  const validatedItems: T[] = []
  const errors: Array<{ path: string; message: string; code: string }> = []

  for (let i = 0; i < dataArray.length; i++) {
    const result = validateData(schema, dataArray[i], `${context}[${i}]`)
    if (result.success) {
      validatedItems.push(result.data)
    } else {
      errors.push(...result.errors)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: validatedItems }
}

/**
 * レコードタイプに対応するスキーマを取得する関数
 */
export function getSchemaForRecordType(recordType: string): z.ZodType | null {
  switch (recordType.toLowerCase()) {
    case "games":
      return GameRecordSchema
    case "playsessions":
      return PlaySessionRecordSchema
    case "uploads":
      return UploadRecordSchema
    case "chapters":
      return ChapterRecordSchema
    case "memos":
      return MemoRecordSchema
    default:
      return null
  }
}

/**
 * Date型フィールドをISO文字列に変換する汎用関数
 * @param data 変換対象のデータ
 * @returns Date型フィールドが文字列に変換されたデータ
 */
export function convertDatesToStrings<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Date) {
    return data.toISOString() as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertDatesToStrings(item)) as T
  }

  if (typeof data === "object") {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      converted[key] = convertDatesToStrings(value)
    }
    return converted as T
  }

  return data
}

// =============================================================================
// 日時処理ユーティリティ（JST前提）
// =============================================================================

/**
 * 現在の日時を取得
 * @returns 現在の日時
 */
export function getCurrentDate(): Date {
  return new Date()
}

/**
 * 日時を日本語形式でフォーマット
 * @param date フォーマット対象の日時
 * @param formatString フォーマット文字列（デフォルト: "yyyy-MM-dd HH:mm:ss"）
 * @returns フォーマットされた文字列
 */
export function formatDateInJapanese(date: Date, formatString = "yyyy-MM-dd HH:mm:ss"): string {
  return format(date, formatString, { locale: ja })
}

/**
 * エクスポート用のタイムスタンプを生成
 * @returns ファイル名に使用可能な形式のタイムスタンプ
 */
export function generateExportTimestamp(): string {
  const now = new Date()
  return format(now, "yyyy-MM-dd_HH-mm-ss", { locale: ja })
}

/**
 * ログ用のタイムスタンプを生成
 * @returns ログ出力用のタイムスタンプ（ISO文字列）
 */
export function generateLogTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Date型フィールドをISO文字列に変換する関数
 * @param data 変換対象のデータ
 * @returns Date型フィールドがISO文字列に変換されたデータ
 */
export function convertDatesToISOStrings<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Date) {
    return data.toISOString() as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertDatesToISOStrings(item)) as T
  }

  if (typeof data === "object") {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      converted[key] = convertDatesToISOStrings(value)
    }
    return converted as T
  }

  return data
}
