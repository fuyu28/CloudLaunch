import { z } from "zod"

/**
 * プレイセッション編集用のバリデーションスキーマ
 * セッション名と章IDの編集データ検証に使用
 */
export const playSessionEditSchema = z.object({
  sessionName: z
    .string()
    .min(1, "セッション名は必須です")
    .max(200, "セッション名は200文字以内で入力してください")
    .trim(),
  chapterId: z.uuid("有効な章IDを指定してください").nullable()
})

/**
 * プレイセッション編集データの型定義（zodスキーマから自動生成）
 */
export type PlaySessionEditData = z.infer<typeof playSessionEditSchema>
