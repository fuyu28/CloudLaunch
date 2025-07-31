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
export type ImportFormat = ExportFormat

export interface ExportOptions {
  format: ExportFormat
  includeGames?: boolean
  includePlaySessions?: boolean
  includeUploads?: boolean
  includeChapters?: boolean
  includeMemos?: boolean
}

export interface ImportOptions {
  format: ImportFormat
  mode: "merge" | "replace" | "skip"
  includeGames?: boolean
  includePlaySessions?: boolean
  includeUploads?: boolean
  includeChapters?: boolean
  includeMemos?: boolean
}

export interface ImportResult {
  totalRecords: number
  successfulImports: number
  skippedRecords: number
  errors: Array<{
    table: string
    record: unknown
    error: string
  }>
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
 * データインポート処理のIPCハンドラー（ファイル選択 → 分析 → インポート統合版）
 * ユーザーが選択したファイルを自動分析してからインポートする
 */
export const handleDataImport = async (
  _event: Electron.IpcMainInvokeEvent,
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
  try {
    // インポートファイルの選択ダイアログを表示
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      title: "インポートファイルを選択してください",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "CSV Files", extensions: ["csv"] },
        { name: "SQL Files", extensions: ["sql"] },
        { name: "All Files", extensions: ["*"] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        message: "ファイルの選択がキャンセルされました"
      }
    }

    const filePath = result.filePaths[0]
    const fileContent = await fs.readFile(filePath, "utf8")

    // ファイル形式を判定
    const fileExtension = path.extname(filePath).toLowerCase()
    let format: ImportFormat | null = null

    switch (fileExtension) {
      case ".json":
        format = "json"
        break
      case ".csv":
        format = "csv"
        break
      case ".sql":
        format = "sql"
        break
      default:
        // 内容から推測
        try {
          JSON.parse(fileContent)
          format = "json"
        } catch {
          if (fileContent.includes("INSERT INTO")) {
            format = "sql"
          } else if (fileContent.includes(",")) {
            format = "csv"
          }
        }
    }

    // ファイル内容を分析
    const analysis = await exportService.analyzeImportFile(fileContent, format)

    // フォーマットが判定できない場合は分析結果のみ返す
    if (!format || !analysis.hasValidStructure) {
      return {
        success: true,
        data: {
          analysis: {
            format,
            recordCounts: analysis.recordCounts,
            hasValidStructure: analysis.hasValidStructure
          },
          filePath
        }
      }
    }

    // インポート処理を実行（フォーマットを分析結果で上書き）
    const finalOptions = { ...options, format }
    const importResult = await exportService.importData(fileContent, finalOptions)

    // 完了通知
    showNotification(
      "データインポート完了",
      `${importResult.successfulImports}件のレコードがインポートされました`
    )

    return {
      success: true,
      data: {
        analysis: {
          format,
          recordCounts: analysis.recordCounts,
          hasValidStructure: analysis.hasValidStructure
        },
        importResult,
        filePath
      }
    }
  } catch (error) {
    console.error("データインポートエラー:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "データインポートに失敗しました"
    }
  }
}

/**
 * インポートファイルの内容を解析して事前情報を取得
 */
export const handleAnalyzeImportFile = async (): Promise<
  ApiResult<{
    format: ImportFormat | null
    recordCounts: Record<string, number>
    hasValidStructure: boolean
  }>
> => {
  try {
    // ファイル選択ダイアログを表示
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      title: "分析するファイルを選択してください",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "CSV Files", extensions: ["csv"] },
        { name: "SQL Files", extensions: ["sql"] },
        { name: "All Files", extensions: ["*"] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        message: "ファイルの選択がキャンセルされました"
      }
    }

    const filePath = result.filePaths[0]
    const fileContent = await fs.readFile(filePath, "utf8")

    // ファイル形式を判定
    const fileExtension = path.extname(filePath).toLowerCase()
    let format: ImportFormat | null = null

    switch (fileExtension) {
      case ".json":
        format = "json"
        break
      case ".csv":
        format = "csv"
        break
      case ".sql":
        format = "sql"
        break
      default:
        // 内容から推測
        try {
          JSON.parse(fileContent)
          format = "json"
        } catch {
          if (fileContent.includes("INSERT INTO")) {
            format = "sql"
          } else if (fileContent.includes(",")) {
            format = "csv"
          }
        }
    }

    // ファイル内容を分析
    const analysis = await exportService.analyzeImportFile(fileContent, format)

    return {
      success: true,
      data: {
        format,
        recordCounts: analysis.recordCounts,
        hasValidStructure: analysis.hasValidStructure
      }
    }
  } catch (error) {
    console.error("ファイル分析エラー:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "ファイル分析に失敗しました"
    }
  }
}

/**
 * データエクスポート関連のIPCハンドラーを登録
 */
export const registerDataExportHandlers = (): void => {
  ipcMain.handle("data-export", handleDataExport)
  ipcMain.handle("get-export-stats", handleGetExportStats)
  ipcMain.handle("data-import", handleDataImport)
  ipcMain.handle("analyze-import-file", handleAnalyzeImportFile)
}
