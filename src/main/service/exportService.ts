/**
 * @fileoverview データエクスポートサービス
 *
 * このサービスは、データベースからのデータ取得とエクスポート形式への変換を担当します。
 * 責務を明確に分離し、保守性を向上させたリファクタリング済みの実装です。
 *
 * 主な機能：
 * - データベースからの全テーブルデータ取得
 * - JSON/CSV/SQL形式でのエクスポート機能
 * - zodスキーマによるデータ整合性検証
 * - エクスポート統計情報の提供
 * - 日付フィールドの自動変換とフォーマット
 */

import { prisma as db } from "../db"
import {
  validateData,
  convertDatesToStrings,
  formatDateInJapanese
} from "./validation/commonSchemas"
import {
  ExportGameRecordSchema,
  ExportPlaySessionRecordSchema,
  ExportUploadRecordSchema,
  ExportChapterRecordSchema,
  ExportMemoRecordSchema
} from "./validation/exportSchemas"
import type { ExportOptions } from "../ipcHandlers/dataExportHandlers"
import type { ZodType } from "zod"

// 型定義

export interface ExportStats {
  gamesCount: number
  playSessionsCount: number
  uploadsCount: number
  chaptersCount: number
  memosCount: number
}

export interface ExportData {
  games?: unknown[]
  playSessions?: unknown[]
  uploads?: unknown[]
  chapters?: unknown[]
  memos?: unknown[]
}

/**
 * ExportService クラス（リファクタリング済み）
 */

export class ExportService {
  /**
   * エクスポート統計情報を取得します
   *
   * @returns Promise<ExportStats> 各テーブルのレコード数
   */
  async getExportStats(): Promise<ExportStats> {
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
   * データベースのデータをエクスポートします
   *
   * @param options エクスポートオプション（形式、含めるテーブル等）
   * @returns Promise<string> エクスポートされたデータの文字列
   */
  async exportData(options: ExportOptions): Promise<string> {
    // データ取得
    const data = await this.fetchDataForExport(options)

    // 形式別エクスポート
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

  // データ取得メソッド

  /**
   * エクスポート対象のデータを取得します（zodバリデーション付き）
   * データベースから取得したデータの整合性をチェックし、不正なデータはログに記録します。
   *
   * @param options エクスポートオプション
   * @returns Promise<ExportData> バリデーション済みのデータ
   */
  private async fetchDataForExport(options: ExportOptions): Promise<ExportData> {
    const data: ExportData = {}

    if (options.includeGames !== false) {
      const rawGames = await db.game.findMany({
        orderBy: { createdAt: "asc" }
      })
      data.games = this.validateExportData("games", rawGames, ExportGameRecordSchema)
    }

    if (options.includePlaySessions !== false) {
      const rawPlaySessions = await db.playSession.findMany({
        orderBy: { playedAt: "asc" }
      })
      data.playSessions = this.validateExportData(
        "playSessions",
        rawPlaySessions,
        ExportPlaySessionRecordSchema
      )
    }

    if (options.includeUploads !== false) {
      const rawUploads = await db.upload.findMany({
        orderBy: { createdAt: "asc" }
      })
      data.uploads = this.validateExportData("uploads", rawUploads, ExportUploadRecordSchema)
    }

    if (options.includeChapters !== false) {
      const rawChapters = await db.chapter.findMany({
        orderBy: [{ gameId: "asc" }, { order: "asc" }]
      })
      data.chapters = this.validateExportData("chapters", rawChapters, ExportChapterRecordSchema)
    }

    if (options.includeMemos !== false) {
      const rawMemos = await db.memo.findMany({
        orderBy: { createdAt: "asc" }
      })
      data.memos = this.validateExportData("memos", rawMemos, ExportMemoRecordSchema)
    }

    return data
  }

  /**
   * エクスポートデータのバリデーションを実行します
   *
   * @param tableName テーブル名（ログ出力用）
   * @param records バリデーション対象のレコード配列
   * @param schema zodスキーマ
   * @returns unknown[] バリデーション済みの有効なレコード配列
   */
  private validateExportData(tableName: string, records: unknown[], schema: ZodType): unknown[] {
    const validRecords: unknown[] = []
    const invalidRecords: { record: unknown; errors: string[] }[] = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const result = validateData(schema, record, `${tableName}[${i}]`)

      if (result.success) {
        // Date型フィールドをISO文字列に変換してエクスポート用に整形
        const exportRecord = convertDatesToStrings(result.data)
        validRecords.push(exportRecord)
      } else {
        const errors = result.errors.map((err) => `${err.path}: ${err.message}`)
        invalidRecords.push({ record, errors })
        console.warn(`エクスポート時バリデーションエラー [${tableName}][${i}]:`, errors.join(", "))
      }
    }

    if (invalidRecords.length > 0) {
      console.warn(
        `${tableName}テーブルで${invalidRecords.length}件の不正なレコードを検出しました。` +
          `有効レコード数: ${validRecords.length}/${records.length}`
      )
    } else {
      console.log(`${tableName}テーブル: 全${records.length}件のレコードが有効です`)
    }

    return validRecords
  }

  // 形式別エクスポートメソッド

  /**
   * CSV形式でエクスポートします
   *
   * @param data エクスポートデータ
   * @returns string CSV形式の文字列
   */
  private exportToCSV(data: ExportData): string {
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
   * JSON形式でエクスポートします
   *
   * @param data エクスポートデータ
   * @returns string JSON形式の文字列
   */
  private exportToJSON(data: ExportData): string {
    // ISO 8601標準形式でエクスポート日時を記録
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * SQL形式でエクスポートします
   *
   * @param data エクスポートデータ
   * @returns string SQL形式の文字列
   */
  private exportToSQL(data: ExportData): string {
    let sqlContent = "-- CloudLaunch データエクスポート\n"
    // エクスポート日時を記録（date-fns使用）
    const now = new Date()
    const jstDateString = formatDateInJapanese(now, "yyyy-MM-dd HH:mm:ss")
    sqlContent += `-- エクスポート日時: ${jstDateString} (JST)\n\n`

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

// シングルトンインスタンス
export const exportService = new ExportService()
