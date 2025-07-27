import { z } from "zod"

/**
 * R2/S3認証情報のバリデーションスキーマ
 * クラウドストレージ接続情報の検証に使用
 */
export const credsSchema = z.object({
  bucketName: z
    .string()
    .min(1, "バケット名は必須です")
    .max(63, "バケット名は63文字以内で入力してください"),
  region: z
    .string()
    .min(1, "リージョンは必須です")
    .max(50, "リージョンは50文字以内で入力してください"),
  endpoint: z.url("有効なURLを入力してください"),
  accessKeyId: z
    .string()
    .min(1, "アクセスキーIDは必須です")
    .max(128, "アクセスキーIDは128文字以内で入力してください"),
  secretAccessKey: z
    .string()
    .min(1, "シークレットアクセスキーは必須です")
    .min(20, "シークレットアクセスキーは20文字以上で入力してください")
})

/**
 * 認証情報の型定義（zodスキーマから自動生成）
 */
export type Credentials = z.infer<typeof credsSchema>

/**
 * 認証情報の部分更新用スキーマ
 * 設定フォームでの部分更新に使用
 */
export const partialCredsSchema = credsSchema.partial()

/**
 * 部分認証情報の型定義
 */
export type PartialCredentials = z.infer<typeof partialCredsSchema>
