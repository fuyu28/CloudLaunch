/**
 * @fileoverview データエクスポート機能のIPCハンドラー
 * データベースの全データをCSV、JSON、SQL形式でエクスポートする機能を提供
 */

import { promises as fs } from "fs"
import path from "path"

import { ipcMain, dialog } from "electron"

import type { ApiResult } from "../../types/result"
import { exportService } from "../service/exportService"
import { showNotification } from "../utils/notification"

export type ExportFormat = "csv" | "json" | "sql"

export interface ExportOptions {
  format: ExportFormat
  includeGames?: boolean
  includePlaySessions?: boolean
  includeUploads?: boolean
  includeChapters?: boolean
  includeMemos?: boolean
}

/**
 * データエクスポート処理のIPCハンドラー
 * ユーザーが選択したフォルダにデータをエクスポートする
 */
export const handleDataExport = async (
  _event: Electron.IpcMainInvokeEvent,
  options: ExportOptions
): Promise<ApiResult<string>> => {
  try {
    // 保存先フォルダの選択ダイアログを表示
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "エクスポート先フォルダを選択してください"
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        message: "フォルダの選択がキャンセルされました"
      }
    }

    const exportDir = result.filePaths[0]
    // 日本標準時（JST）でタイムスタンプを生成
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000 // JST は UTC+9
    const jstDate = new Date(now.getTime() + jstOffset)
    const timestamp = jstDate.toISOString().replace(/[:.]/g, "-")

    // エクスポートファイル名を生成
    const fileName = `cloudlaunch_export_${timestamp}.${options.format}`
    const filePath = path.join(exportDir, fileName)

    // データをエクスポート
    const exportData = await exportService.exportData(options)

    // ファイルに書き込み
    await fs.writeFile(filePath, exportData, "utf8")

    // 完了通知
    showNotification("データエクスポート完了", `データが正常にエクスポートされました: ${fileName}`)

    return {
      success: true,
      data: filePath
    }
  } catch (error) {
    console.error("データエクスポートエラー:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "データエクスポートに失敗しました"
    }
  }
}

/**
 * エクスポート可能なデータの統計情報を取得
 * エクスポート前にユーザーに情報を提供するため
 */
export const handleGetExportStats = async (): Promise<
  ApiResult<{
    gamesCount: number
    playSessionsCount: number
    uploadsCount: number
    chaptersCount: number
    memosCount: number
  }>
> => {
  try {
    const stats = await exportService.getExportStats()
    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error("エクスポート統計取得エラー:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "統計情報の取得に失敗しました"
    }
  }
}

/**
 * データエクスポート関連のIPCハンドラーを登録
 */
export const registerDataExportHandlers = (): void => {
  ipcMain.handle("data-export", handleDataExport)
  ipcMain.handle("get-export-stats", handleGetExportStats)
}
