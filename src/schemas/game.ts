import { z } from "zod"

/**
 * ゲーム登録・編集用のバリデーションスキーマ
 * フォーム入力値の検証に使用
 */
export const gameSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "100文字以内で入力してください"),
  publisher: z.string().min(1, "ブランド名は必須です").max(50, "50文字以内で入力してください"),
  imagePath: z.string().optional().or(z.literal("")),
  exePath: z.string().min(1, "実行ファイルのパスは必須です"),
  saveFolderPath: z.string().optional().or(z.literal("")),
  playStatus: z.enum(["unplayed", "playing", "played"])
})

/**
 * ゲームデータの型定義（zodスキーマから自動生成）
 */
export type GameData = z.infer<typeof gameSchema>

/**
 * ゲームフォーム入力データの追加バリデーション
 * ファイルパスの存在チェックや拡張子チェックなど
 */
export const gameFormSchema = gameSchema
  .refine(
    (data) => {
      // 実行ファイルの拡張子チェック
      if (
        data.exePath &&
        ![".exe", ".app"].some((ext) => data.exePath.toLowerCase().endsWith(ext))
      ) {
        return false
      }
      return true
    },
    {
      message: "実行ファイル（.exe または .app）を指定してください",
      path: ["exePath"]
    }
  )
  .refine(
    (data) => {
      // 画像ファイルの拡張子チェック（入力がある場合のみ）
      if (data.imagePath && data.imagePath.trim()) {
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
        if (!imageExtensions.some((ext) => data.imagePath!.toLowerCase().endsWith(ext))) {
          return false
        }
      }
      return true
    },
    {
      message: "画像ファイル（PNG、JPG、GIF等）を指定してください",
      path: ["imagePath"]
    }
  )

/**
 * ゲームプロセス監視状態のスキーマ
 * ゲーム起動中の状態管理に使用
 */
export const monitoringGameStatusSchema = z.object({
  gameId: z.uuid("有効なUUIDを指定してください"),
  gameTitle: z.string().min(1, "ゲームタイトルは必須です"),
  exeName: z.string().min(1, "実行ファイル名は必須です"),
  isPlaying: z.boolean(),
  playTime: z.number().min(0, "プレイ時間は0以上である必要があります")
})

/**
 * ゲーム監視状態の型定義
 */
export type MonitoringGameStatus = z.infer<typeof monitoringGameStatusSchema>
