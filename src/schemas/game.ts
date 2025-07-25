import { z } from "zod"

export const gameSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "100文字以内で入力してください"),
  publisher: z.string().min(1, "ブランド名は必須です").max(100, "100文字以内で入力してください"),
  imagePath: z.string().optional(),
  exePath: z.string().min(1, "実行ファイルのパスは必須です"),
  saveFolderPath: z.string().optional(),
  playStatus: z.enum(["unplayed, playing, played"])
})

export const monitoringGameStatusSchema = z.object({
  gameId: z.uuidv4(),
  gameTitle: z.string(),
  exeName: z.string(),
  isPlaying: z.boolean(),
  playTime: z.number().min(0)
})
