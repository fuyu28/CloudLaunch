/**
 * @fileoverview データエクスポート機能のPreload API
 * レンダラープロセスからメインプロセスのエクスポート機能を呼び出すためのAPI
 */

import { ipcRenderer } from "electron"

import type { ExportOptions } from "../../main/ipcHandlers/dataExportHandlers"
import type { ApiResult } from "../../types/result"

export interface ExportStats {
  gamesCount: number
  playSessionsCount: number
  uploadsCount: number
  chaptersCount: number
  memosCount: number
}

/**
 * データエクスポート用のPreload API
 */
export const dataExportAPI = {
  /**
   * データをエクスポート
   * @param options エクスポートオプション
   * @returns エクスポートされたファイルのパス
   */
  exportData: (options: ExportOptions): Promise<ApiResult<string>> => {
    return ipcRenderer.invoke("data-export", options)
  },

  /**
   * エクスポート統計情報を取得
   * @returns 各テーブルのレコード数
   */
  getExportStats: (): Promise<ApiResult<ExportStats>> => {
    return ipcRenderer.invoke("get-export-stats")
  }
}
