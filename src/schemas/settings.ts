import { z } from "zod"

/**
 * 自動追跡設定用のバリデーションスキーマ
 * プレイ時間自動追跡機能のON/OFF設定検証
 */
export const autoTrackingSettingsSchema = z.object({
  enabled: z.boolean().describe("自動追跡機能の有効/無効フラグ")
})

/**
 * 自動追跡設定の型定義（zodスキーマから自動生成）
 */
export type AutoTrackingSettings = z.infer<typeof autoTrackingSettingsSchema>
