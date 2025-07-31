/**
 * @fileoverview データエクスポート機能のPreload API
 * レンダラープロセスからメインプロセスのエクスポート機能を呼び出すためのAPI
 */

import { ipcRenderer } from "electron"

import type {
  ExportOptions,
  ImportOptions,
  ImportResult,
  ImportFormat
} from "../../main/ipcHandlers/dataExportHandlers"
import type { ApiResult } from "../../types/result"

export interface ExportStats {
  gamesCount: number
  playSessionsCount: number
  uploadsCount: number
  chaptersCount: number
  memosCount: number
}

/**
 * データエクスポート/インポート用のPreload API
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
  },

  /**
   * ファイルを選択してインポート（分析 → インポート統合版）
   * @param options インポートオプション
   * @returns 分析結果とインポート結果
   */
  importData: (
    options: ImportOptions
  ): Promise<
    ApiResult<{
      analysis: {
        format: ImportFormat | null
        recordCounts: Record<string, number>
        hasValidStructure: boolean
      }
      importResult?: ImportResult
      filePath: string
    }>
  > => {
    return ipcRenderer.invoke("data-import", options)
  },

  /**
   * インポートファイルを分析
   * @returns ファイル分析結果
   */
  analyzeImportFile: (): Promise<
    ApiResult<{
      format: ImportFormat | null
      recordCounts: Record<string, number>
      hasValidStructure: boolean
    }>
  > => {
    return ipcRenderer.invoke("analyze-import-file")
  }
}
