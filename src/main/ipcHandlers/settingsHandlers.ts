/**
 * @fileoverview 設定管理のIPC通信ハンドラー
 *
 * このファイルは、フロントエンドとメインプロセス間での設定同期機能を提供します。
 *
 * 主な機能：
 * - 自動ゲーム検出設定の更新通知
 * - プロセス監視の動的制御
 * - 設定変更のリアルタイム反映
 */

import { ipcMain } from "electron"
import Store from "electron-store"
import { ZodError } from "zod"

import { autoTrackingSettingsSchema } from "../../schemas/settings"
import type { ApiResult } from "../../types/result"
import ProcessMonitorService from "../service/processMonitorService"
import { logger } from "../utils/logger"

const store = new Store()

export function registerSettingsHandlers(): void {
  /**
   * 自動ゲーム検出設定の更新ハンドラー
   *
   * フロントエンドから自動ゲーム検出設定の変更を受け取り、
   * メインプロセスの設定を更新します。
   * 設定は即座に反映されます。
   *
   * @param enabled 自動ゲーム検出を有効にするかどうか
   * @returns ApiResult 更新結果
   */
  ipcMain.handle(
    "settings:updateAutoTracking",
    async (_event, enabled: boolean): Promise<ApiResult> => {
      try {
        // Zodスキーマで入力を検証
        const validatedSettings = autoTrackingSettingsSchema.parse({ enabled })

        // electron-storeに設定を保存
        store.set("autoTracking", validatedSettings.enabled)

        // ProcessMonitorServiceにリアルタイムで設定を反映
        const processMonitor = ProcessMonitorService.getInstance()
        processMonitor.updateAutoTracking(enabled)

        logger.info(`自動ゲーム検出設定を更新: ${validatedSettings.enabled ? "有効" : "無効"}`)

        return { success: true }
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            success: false,
            message: `入力データが無効です: ${error.issues.map((issue) => issue.message).join(", ")}`
          }
        }
        logger.error("自動ゲーム検出設定の更新に失敗:", error)
        return {
          success: false,
          message: "自動ゲーム検出設定の更新に失敗しました"
        }
      }
    }
  )

  /**
   * 自動ゲーム検出設定の取得ハンドラー
   *
   * メインプロセスの自動ゲーム検出設定を取得します。
   *
   * @returns ApiResult<boolean> 現在の設定値
   */
  ipcMain.handle("settings:getAutoTracking", async (): Promise<ApiResult<boolean>> => {
    try {
      const autoTracking = store.get("autoTracking", true) as boolean
      return {
        success: true,
        data: autoTracking
      }
    } catch (error) {
      logger.error("自動ゲーム検出設定の取得に失敗:", error)
      return {
        success: false,
        message: "自動ゲーム検出設定の取得に失敗しました"
      }
    }
  })
}
