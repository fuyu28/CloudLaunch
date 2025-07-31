/**
 * @fileoverview データエクスポート機能のサービスクラス
 * データベースの全データをCSV、JSON、SQL形式でエクスポートする
 */

import { prisma as db } from "../db"
import type { ExportOptions } from "../ipcHandlers/dataExportHandlers"

export class ExportService {
  /**
   * データベースのデータをエクスポート
   * @param options エクスポートオプション（形式、含めるテーブル等）
   * @returns エクスポートされたデータの文字列
   */
  async exportData(options: ExportOptions): Promise<string> {
    const data = await this.fetchDataForExport(options)

    switch (options.format) {
      case "csv":
        return this.exportToCSV(data)
      case "json":
        return this.exportToJSON(data)
      case "sql":
        return this.exportToSQL(data)
      default:
        throw new Error(`サポートされていない形式です: ${options.format}`)
    }
  }

  /**
   * エクスポート統計情報を取得
   * @returns 各テーブルのレコード数
   */
  async getExportStats(): Promise<{
    gamesCount: number
    playSessionsCount: number
    uploadsCount: number
    chaptersCount: number
    memosCount: number
  }> {
    const [gamesCount, playSessionsCount, uploadsCount, chaptersCount, memosCount] =
      await Promise.all([
        db.game.count(),
        db.playSession.count(),
        db.upload.count(),
        db.chapter.count(),
        db.memo.count()
      ])

    return {
      gamesCount,
      playSessionsCount,
      uploadsCount,
      chaptersCount,
      memosCount
    }
  }

  /**
   * エクスポート対象のデータを取得
   */
  private async fetchDataForExport(options: ExportOptions): Promise<Record<string, unknown[]>> {
    const data: Record<string, unknown[]> = {}

    if (options.includeGames !== false) {
      data.games = await db.game.findMany({
        orderBy: { createdAt: "asc" }
      })
    }

    if (options.includePlaySessions !== false) {
      data.playSessions = await db.playSession.findMany({
        orderBy: { playedAt: "asc" }
      })
    }

    if (options.includeUploads !== false) {
      data.uploads = await db.upload.findMany({
        orderBy: { createdAt: "asc" }
      })
    }

    if (options.includeChapters !== false) {
      data.chapters = await db.chapter.findMany({
        orderBy: [{ gameId: "asc" }, { order: "asc" }]
      })
    }

    if (options.includeMemos !== false) {
      data.memos = await db.memo.findMany({
        orderBy: { createdAt: "asc" }
      })
    }

    return data
  }

  /**
   * CSV形式でエクスポート
   */
  private exportToCSV(data: Record<string, unknown[]>): string {
    let csvContent = ""

    for (const [tableName, records] of Object.entries(data)) {
      if (!Array.isArray(records) || records.length === 0) continue

      csvContent += `# ${tableName.toUpperCase()}\n`

      // ヘッダー行
      const firstRecord = records[0] as Record<string, unknown>
      const headers = Object.keys(firstRecord)
      csvContent += headers.join(",") + "\n"

      // データ行
      for (const record of records) {
        const recordObj = record as Record<string, unknown>
        const values = headers.map((header) => {
          const value = recordObj[header]
          if (value === null || value === undefined) return ""
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return String(value)
        })
        csvContent += values.join(",") + "\n"
      }

      csvContent += "\n"
    }

    return csvContent
  }

  /**
   * JSON形式でエクスポート
   */
  private exportToJSON(data: Record<string, unknown[]>): string {
    // 日本標準時（JST）でエクスポート日時を記録
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000 // JST は UTC+9
    const jstDate = new Date(now.getTime() + jstOffset)
    const exportData = {
      exportedAt: jstDate.toISOString() + " (JST)",
      version: "1.0",
      data
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * SQL形式でエクスポート
   */
  private exportToSQL(data: Record<string, unknown[]>): string {
    let sqlContent = "-- CloudLaunch データエクスポート\n"
    // 日本標準時（JST）でエクスポート日時を記録
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000 // JST は UTC+9
    const jstDate = new Date(now.getTime() + jstOffset)
    sqlContent += `-- エクスポート日時: ${jstDate.toISOString()} (JST)\n\n`

    for (const [tableName, records] of Object.entries(data)) {
      if (!Array.isArray(records) || records.length === 0) continue

      sqlContent += `-- ${tableName.toUpperCase()} テーブル\n`

      for (const record of records) {
        const recordObj = record as Record<string, unknown>
        const columns = Object.keys(recordObj)
        const values = columns.map((col) => {
          const value = recordObj[col]
          if (value === null || value === undefined) return "NULL"
          if (typeof value === "string") {
            return `'${value.replace(/'/g, "''")}'`
          }
          if (value instanceof Date) {
            return `'${value.toISOString()}'`
          }
          return String(value)
        })

        sqlContent += `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`
      }

      sqlContent += "\n"
    }

    return sqlContent
  }
}

export const exportService = new ExportService()
