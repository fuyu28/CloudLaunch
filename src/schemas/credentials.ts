import { z } from "zod"

export const credsSchema = z.object({
  bucketName: z.string().min(1, "バケット名は必須です"),
  region: z.string().min(1, "リージョンは必須です"),
  endpoint: z.url(),
  accessKeyId: z.string().min(1, "アクセスキーIDは必須です"),
  secretAccessKey: z.string().min(1, "シークレットアクセスキーは必須です")
})
