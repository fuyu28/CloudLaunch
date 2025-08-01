/**
 * @fileoverview データベース操作関連のzodバリデーションスキーマ
 *
 * IPCハンドラーで受け取るデータベース操作パラメータの検証用スキーマを定義
 */

import { z } from "zod"

/**
 * UUID形式のバリデーションスキーマ
 */
export const UuidSchema = z.uuid("有効なUUID形式である必要があります")

/**
 * ファイルパスのバリデーションスキーマ
 */
export const FilePathSchema = z
  .string()
  .min(1, "ファイルパスが空です")
  .refine((path) => !path.includes(".."), "不正なパス（相対パス）は使用できません")

/**
 * ゲーム作成時の入力データスキーマ
 */
export const InputGameDataSchema = z
  .object({
    title: z
      .string()
      .min(1, "タイトルは必須です")
      .max(255, "タイトルは255文字以内で入力してください"),
    publisher: z
      .string()
      .min(1, "発行元は必須です")
      .max(255, "発行元は255文字以内で入力してください"),
    saveFolderPath: z.string().optional(),
    exePath: FilePathSchema,
    imagePath: z.string().optional(),
    playStatus: z.enum(["unplayed", "playing", "played"])
  })
  .strict()

/**
 * ゲーム更新時のデータスキーマ
 */
export const GameUpdateDataSchema = z
  .object({
    title: z
      .string()
      .min(1, "タイトルは必須です")
      .max(255, "タイトルは255文字以内で入力してください"),
    publisher: z
      .string()
      .min(1, "発行元は必須です")
      .max(255, "発行元は255文字以内で入力してください"),
    saveFolderPath: z.string().nullable(),
    exePath: FilePathSchema,
    imagePath: z.string().nullable(),
    playStatus: z.enum(["unplayed", "playing", "played"]),
    clearedAt: z.date().nullable().optional()
  })
  .strict()

/**
 * フィルターオプションのスキーマ
 */
export const FilterOptionSchema = z.enum([
  "all",
  "unplayed",
  "playing",
  "played" // clearedからplayedに修正
])

/**
 * ソートオプションのスキーマ
 */
export const SortOptionSchema = z.enum([
  "title",
  "lastPlayed",
  "totalPlayTime",
  "publisher",
  "lastRegistered"
])

/**
 * ソート方向のスキーマ
 */
export const SortDirectionSchema = z.enum(["asc", "desc"])

/**
 * プレイセッション作成時のデータスキーマ
 */
export const PlaySessionCreateDataSchema = z
  .object({
    gameId: UuidSchema,
    startTime: z.date(),
    endTime: z.date().optional(),
    playTime: z.number().min(0, "プレイ時間は0以上である必要があります").optional()
  })
  .strict()

/**
 * プレイセッション更新時のデータスキーマ
 */
export const PlaySessionUpdateDataSchema = z
  .object({
    endTime: z.date(),
    playTime: z.number().min(0, "プレイ時間は0以上である必要があります")
  })
  .strict()

/**
 * 検索キーワードのスキーマ
 */
export const SearchWordSchema = z
  .string()
  .max(255, "検索キーワードは255文字以内である必要があります")

/**
 * プレイ時間（秒）のスキーマ
 */
export const PlayTimeSchema = z.number().min(0, "プレイ時間は0以上である必要があります")

/**
 * プレイステータスのスキーマ（単体）
 */
export const PlayStatusSchema = z.enum(["unplayed", "playing", "played"])

/**
 * セッション名のスキーマ
 */
export const SessionNameSchema = z
  .string()
  .min(1, "セッション名は必須です")
  .max(255, "セッション名は255文字以内で入力してください")

/**
 * バリデーション結果の型定義
 */
export type DatabaseValidationResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      errors: string[]
    }

/**
 * IPCパラメータの汎用バリデーション関数
 * @param schema zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validateDatabaseInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): DatabaseValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const errors = result.error.issues.map((err) => `${err.path.join(".")}: ${err.message}`)
    return { success: false, errors }
  }
}
