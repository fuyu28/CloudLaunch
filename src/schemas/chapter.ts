import { z } from "zod"

/**
 * 章作成用のバリデーションスキーマ
 * 新しい章を作成する際の入力データ検証に使用
 */
export const chapterCreateSchema = z.object({
  name: z.string().min(1, "章名は必須です").max(100, "章名は100文字以内で入力してください").trim(),
  gameId: z.uuid("有効なゲームIDを指定してください"),
  order: z
    .number()
    .int("順序は整数で指定してください")
    .min(0, "順序は0以上で指定してください")
    .optional()
})

/**
 * 章更新用のバリデーションスキーマ
 * 既存の章を更新する際の入力データ検証に使用
 */
export const chapterUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "章名は必須です")
    .max(100, "章名は100文字以内で入力してください")
    .trim()
    .optional(),
  order: z
    .number()
    .int("順序は整数で指定してください")
    .min(0, "順序は0以上で指定してください")
    .optional(),
  isActive: z.boolean().optional()
})

/**
 * 章ID検証用スキーマ
 * 章IDの妥当性チェックに使用
 */
export const chapterIdSchema = z.uuid("有効な章IDを指定してください")

/**
 * 章作成データの型定義（zodスキーマから自動生成）
 */
export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>

/**
 * 章更新データの型定義（zodスキーマから自動生成）
 */
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>
