/**
 * @fileoverview 設定管理のPreloadスクリプト
 */

import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

export const settingsPreloadApi = {
  /**
   * 自動計測設定を更新
   */
  updateAutoTracking: (enabled: boolean): Promise<ApiResult> =>
    ipcRenderer.invoke("settings:updateAutoTracking", enabled),

  /**
   * 自動計測設定を取得
   */
  getAutoTracking: (): Promise<ApiResult<boolean>> => ipcRenderer.invoke("settings:getAutoTracking")
}
