/**
 * @fileoverview インポートデータのバリデーション用Zodスキーマ
 *
 * データベースインポート時のデータ形式をバリデーションします。
 * 各テーブルに対応するスキーマを定義し、データの整合性を保証します。
 */

import { z } from "zod"

/**
 * プレイステータスの列挙型
 */
const PlayStatusSchema = z.enum(["unplayed", "playing", "played"])

/**
 * ゲームレコードのバリデーションスキーマ
 */
export const GameRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  title: z.string().min(1, "タイトルは必須です"),
  publisher: z.string().optional().nullable(),
  imagePath: z.string().optional().nullable(),
  exePath: z.string().min(1, "実行ファイルパスは必須です"),
  saveFolderPath: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  playStatus: PlayStatusSchema.optional().default("unplayed"),
  totalPlayTime: z.number().min(0, "プレイ時間は0以上である必要があります").optional().default(0),
  lastPlayed: z.string().optional().nullable(),
  clearedAt: z.string().optional().nullable(),
  currentChapter: z.string().optional().nullable()
})

/**
 * プレイセッションレコードのバリデーションスキーマ
 */
export const PlaySessionRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  gameId: z.string().min(1, "ゲームIDは必須です"),
  playedAt: z.string().optional(),
  duration: z.number().min(0, "プレイ時間は0以上である必要があります").optional().default(0),
  sessionName: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  uploadId: z.string().optional().nullable()
})

/**
 * アップロードレコードのバリデーションスキーマ
 */
export const UploadRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  gameId: z.string().min(1, "ゲームIDは必須です"),
  clientId: z.string().optional().nullable(),
  comment: z.string().optional().default(""),
  createdAt: z.string().optional()
})

/**
 * チャプターレコードのバリデーションスキーマ
 */
export const ChapterRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  gameId: z.string().min(1, "ゲームIDは必須です"),
  name: z.string().min(1, "チャプター名は必須です"),
  order: z.number().min(0, "順序は0以上である必要があります").optional().default(0),
  createdAt: z.string().optional()
})

/**
 * メモレコードのバリデーションスキーマ
 */
export const MemoRecordSchema = z.object({
  id: z.string().min(1, "IDは必須です"),
  gameId: z.string().min(1, "ゲームIDは必須です"),
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

/**
 * JSONインポート全体のスキーマ
 */
export const JsonImportSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(), // より柔軟な文字列形式を許可
  data: z.object({
    games: z.array(GameRecordSchema).optional(),
    playSessions: z.array(PlaySessionRecordSchema).optional(),
    uploads: z.array(UploadRecordSchema).optional(),
    chapters: z.array(ChapterRecordSchema).optional(),
    memos: z.array(MemoRecordSchema).optional()
  })
})

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    path: string
    message: string
    code: string
  }>
  data?: unknown
}

/**
 * データレコードをバリデーションする関数
 */
export function validateRecord(
  record: unknown,
  schema: z.ZodSchema,
  recordType: string,
  index?: number
): ValidationResult {
  try {
    const validatedData = schema.parse(record)
    return {
      isValid: true,
      errors: [],
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => ({
        path:
          index !== undefined
            ? `${recordType}[${index}].${err.path.join(".")}`
            : `${recordType}.${err.path.join(".")}`,
        message: err.message,
        code: err.code
      }))

      return {
        isValid: false,
        errors,
        data: undefined
      }
    }

    return {
      isValid: false,
      errors: [
        {
          path: recordType,
          message: error instanceof Error ? error.message : "不明なエラーが発生しました",
          code: "unknown_error"
        }
      ],
      data: undefined
    }
  }
}

/**
 * JSONインポートデータ全体をバリデーションする関数
 */
export function validateJsonImportData(data: unknown): ValidationResult {
  return validateRecord(data, JsonImportSchema, "importData")
}

/**
 * CSVレコードの配列をバリデーションする関数
 */
export function validateCsvRecords(
  records: unknown[],
  schema: z.ZodSchema,
  recordType: string
): ValidationResult {
  const errors: ValidationResult["errors"] = []
  const validatedRecords: unknown[] = []

  for (let i = 0; i < records.length; i++) {
    const result = validateRecord(records[i], schema, recordType, i)
    if (result.isValid && result.data) {
      validatedRecords.push(result.data)
    } else {
      errors.push(...result.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedRecords
  }
}

/**
 * レコードタイプに対応するスキーマを取得する関数
 */
export function getSchemaForRecordType(recordType: string): z.ZodSchema | null {
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
