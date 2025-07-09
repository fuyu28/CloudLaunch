/**
 * @fileoverview 設定管理のIPC通信ハンドラー
 *
 * このファイルは、フロントエンドとメインプロセス間での設定同期機能を提供します。
 *
 * 主な機能：
 * - 自動計測設定の更新通知
 * - プロセス監視の動的制御
 * - 設定変更のリアルタイム反映
 */

import { ipcMain } from "electron"
import Store from "electron-store"
import { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"

const store = new Store()

export function registerSettingsHandlers(): void {
  /**
   * 自動計測設定の更新ハンドラー
   *
   * フロントエンドから自動計測設定の変更を受け取り、
   * メインプロセスの設定を更新します。
   * 設定は次回アプリケーション起動時に反映されます。
   *
   * @param enabled 自動計測を有効にするかどうか
   * @returns ApiResult 更新結果
   */
  ipcMain.handle("update-auto-tracking", async (_event, enabled: boolean): Promise<ApiResult> => {
    try {
      // electron-storeに設定を保存
      store.set("autoTracking", enabled)
      logger.info(`自動計測設定を更新しました: ${enabled ? "有効" : "無効"} (次回起動時に反映)`)

      return { success: true }
    } catch (error) {
      logger.error("自動計測設定の更新に失敗:", error)
      return {
        success: false,
        message: "自動計測設定の更新に失敗しました"
      }
    }
  })

  /**
   * 自動計測設定の取得ハンドラー
   *
   * メインプロセスの自動計測設定を取得します。
   *
   * @returns ApiResult<boolean> 現在の設定値
   */
  ipcMain.handle("get-auto-tracking", async (): Promise<ApiResult<boolean>> => {
    try {
      const autoTracking = store.get("autoTracking", true) as boolean
      return {
        success: true,
        data: autoTracking
      }
    } catch (error) {
      logger.error("自動計測設定の取得に失敗:", error)
      return {
        success: false,
        message: "自動計測設定の取得に失敗しました"
      }
    }
  })
}
