/**
 * @fileoverview データパーサーサービス
 *
 * このサービスは、インポートファイルの形式判定・解析・バリデーションを担当します。
 * JSON、CSV、SQL形式の統一的な解析処理を提供し、さまざまなファイル形式からのデータインポートをサポートします。
 *
 * 主な機能：
 * - ファイル形式の自動判定（拡張子および内容解析）
 * - JSON/CSV/SQL形式の解析処理
 * - ファイル分析と統計情報取得
 * - レコードレベルのバリデーション機能
 */

import { validateData, getSchemaForRecordType, ExportDataSchema } from "./validation/commonSchemas"
import type { ImportFormat } from "../ipcHandlers/dataExportHandlers"

// 型定義

export interface ParsedData {
  format: ImportFormat
  data: Record<string, unknown[]>
  metadata?: {
    version?: string
    exportedAt?: string
  }
}

export interface FileAnalysis {
  format: ImportFormat | null
  recordCounts: Record<string, number>
  hasValidStructure: boolean
  errors?: string[]
}

/**
 * DataParserService クラス
 */

export class DataParserService {
  /**
   * ファイル形式を自動判定します
   *
   * @param filePath ファイルパス
   * @param fileContent ファイル内容
   * @returns ImportFormat | null 判定された形式（判定不可の場合はnull）
   */
  detectFormat(filePath: string, fileContent: string): ImportFormat | null {
    // 拡張子による判定
    const extension = this.getFileExtension(filePath)
    if (extension) {
      return extension
    }

    // 内容による判定
    return this.detectFormatByContent(fileContent)
  }

  /**
   * ファイル拡張子から形式を判定します
   *
   * @param filePath ファイルパス
   * @returns ImportFormat | null 判定された形式（判定不可の場合はnull）
   */
  private getFileExtension(filePath: string): ImportFormat | null {
    const extension = filePath.toLowerCase().split(".").pop()

    switch (extension) {
      case "json":
        return "json"
      case "csv":
        return "csv"
      case "sql":
        return "sql"
      default:
        return null
    }
  }

  /**
   * ファイル内容から形式を判定します
   *
   * @param fileContent ファイル内容
   * @returns ImportFormat | null 判定された形式（判定不可の場合はnull）
   */
  private detectFormatByContent(fileContent: string): ImportFormat | null {
    try {
      // JSON形式の判定
      JSON.parse(fileContent)
      return "json"
    } catch {
      // SQL形式の判定
      if (fileContent.includes("INSERT INTO")) {
        return "sql"
      }

      // CSV形式の判定（カンマ区切りを含む）
      if (fileContent.includes(",") && fileContent.includes("\n")) {
        return "csv"
      }
    }

    return null
  }

  /**
   * ファイル内容を解析してデータ構造を取得します
   *
   * @param fileContent ファイル内容
   * @param format ファイル形式
   * @returns Promise<ParsedData> 解析されたデータ
   */
  async parseFile(fileContent: string, format: ImportFormat): Promise<ParsedData> {
    switch (format) {
      case "json":
        return this.parseJSON(fileContent)
      case "csv":
        return this.parseCSV(fileContent)
      case "sql":
        return this.parseSQL(fileContent)
      default:
        throw new Error(`サポートされていない形式です: ${format}`)
    }
  }

  /**
   * ファイル内容を分析して統計情報を取得します
   *
   * @param fileContent ファイル内容
   * @param format ファイル形式
   * @returns Promise<FileAnalysis> 分析結果
   */
  async analyzeFile(fileContent: string, format: ImportFormat | null): Promise<FileAnalysis> {
    if (!format) {
      return {
        format: null,
        recordCounts: {},
        hasValidStructure: false,
        errors: ["ファイル形式を判定できませんでした"]
      }
    }

    try {
      const parsedData = await this.parseFile(fileContent, format)

      const recordCounts: Record<string, number> = {}
      for (const [tableName, records] of Object.entries(parsedData.data)) {
        recordCounts[tableName] = Array.isArray(records) ? records.length : 0
      }

      return {
        format,
        recordCounts,
        hasValidStructure: Object.keys(recordCounts).length > 0
      }
    } catch (error) {
      return {
        format,
        recordCounts: {},
        hasValidStructure: false,
        errors: [error instanceof Error ? error.message : "解析エラーが発生しました"]
      }
    }
  }

  // 形式別解析メソッド

  /**
   * JSON形式のファイルを解析します
   *
   * @param fileContent ファイル内容
   * @returns ParsedData 解析されたデータ
   */
  private parseJSON(fileContent: string): ParsedData {
    const parsed = JSON.parse(fileContent)

    // 全体構造のバリデーション
    const validation = validateData(ExportDataSchema, parsed, "jsonImport")
    if (!validation.success) {
      const errorMessages = validation.errors.map((err) => `${err.path}: ${err.message}`)
      throw new Error(`JSON構造のバリデーションエラー: ${errorMessages.join(", ")}`)
    }

    // CloudLaunchエクスポート形式を検出
    if (parsed.data && typeof parsed.data === "object") {
      return {
        format: "json",
        data: parsed.data as Record<string, unknown[]>,
        metadata: {
          version: parsed.version,
          exportedAt: parsed.exportedAt
        }
      }
    }

    // 直接データ形式の場合
    if (typeof parsed === "object" && parsed !== null) {
      return {
        format: "json",
        data: parsed as Record<string, unknown[]>
      }
    }

    throw new Error("有効なJSON形式ではありません")
  }

  /**
   * CSV形式のファイルを解析します
   *
   * @param fileContent ファイル内容
   * @returns ParsedData 解析されたデータ
   */
  private parseCSV(fileContent: string): ParsedData {
    const data: Record<string, unknown[]> = {}
    const lines = fileContent.split("\n").filter((line) => line.trim())

    let currentTable = ""
    let headers: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // テーブル名の検出（# で始まる行）
      if (trimmedLine.startsWith("#")) {
        currentTable = trimmedLine.substring(1).trim().toLowerCase()
        data[currentTable] = []
        headers = []
        continue
      }

      // ヘッダー行の検出（最初の非コメント行）
      if (currentTable && headers.length === 0) {
        headers = this.parseCSVLine(trimmedLine)
        continue
      }

      // データ行の処理
      if (currentTable && headers.length > 0) {
        const values = this.parseCSVLine(trimmedLine)
        if (values.length === headers.length) {
          const record: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            const value = values[index]
            record[header] = value === "" ? null : value
          })

          // 各レコードをバリデーション（警告レベル）
          const schema = getSchemaForRecordType(currentTable)
          if (schema) {
            const validation = validateData(schema, record, currentTable)
            if (!validation.success) {
              const errorMessage = validation.errors
                .map((err) => `${err.path}: ${err.message}`)
                .join(", ")
              console.warn(`CSVレコードのバリデーション警告 (${currentTable}): ${errorMessage}`)
            }
          }

          data[currentTable].push(record)
        }
      }
    }

    if (Object.keys(data).length === 0) {
      throw new Error("有効なCSV形式ではありません")
    }

    return { format: "csv", data }
  }

  /**
   * CSV行をパースします（引用符とエスケープを考慮）
   *
   * @param line CSV行
   * @returns string[] パースされた値の配列
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // エスケープされた引用符
          current += '"'
          i += 2
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes
          i++
        }
      } else if (char === "," && !inQuotes) {
        // フィールドの区切り
        result.push(current)
        current = ""
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }

  /**
   * SQL形式のファイルを解析します
   *
   * @param fileContent ファイル内容
   * @returns ParsedData 解析されたデータ
   */
  private parseSQL(fileContent: string): ParsedData {
    const data: Record<string, unknown[]> = {}
    const lines = fileContent.split("\n")

    for (const line of lines) {
      const trimmedLine = line.trim()

      // INSERT文を検索
      const insertMatch = trimmedLine.match(
        /^INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\);?$/i
      )

      if (insertMatch) {
        const tableName = insertMatch[1].toLowerCase()
        const columnsStr = insertMatch[2]
        const valuesStr = insertMatch[3]

        const columns = columnsStr.split(",").map((col) => col.trim())
        const values = this.parseSQLValues(valuesStr)

        if (!data[tableName]) {
          data[tableName] = []
        }

        if (columns.length === values.length) {
          const record: Record<string, unknown> = {}
          columns.forEach((column, index) => {
            record[column] = values[index]
          })

          // 各レコードをバリデーション（警告レベル）
          const schema = getSchemaForRecordType(tableName)
          if (schema) {
            const validation = validateData(schema, record, tableName)
            if (!validation.success) {
              const errorMessage = validation.errors
                .map((err) => `${err.path}: ${err.message}`)
                .join(", ")
              console.warn(`SQLレコードのバリデーション警告 (${tableName}): ${errorMessage}`)
            }
          }

          data[tableName].push(record)
        }
      }
    }

    if (Object.keys(data).length === 0) {
      throw new Error("有効なSQL形式ではありません")
    }

    return { format: "sql", data }
  }

  /**
   * SQL VALUES句をパースします
   *
   * @param valuesStr VALUES句の文字列
   * @returns unknown[] パースされた値の配列
   */
  private parseSQLValues(valuesStr: string): unknown[] {
    const values: unknown[] = []
    let current = ""
    let inQuotes = false
    let quoteChar = ""
    let i = 0

    while (i < valuesStr.length) {
      const char = valuesStr[i]

      if ((char === "'" || char === '"') && !inQuotes) {
        inQuotes = true
        quoteChar = char
        i++
      } else if (char === quoteChar && inQuotes) {
        if (valuesStr[i + 1] === quoteChar) {
          // エスケープされた引用符
          current += quoteChar
          i += 2
        } else {
          // 引用符の終了
          inQuotes = false
          values.push(current)
          current = ""
          i++
          // カンマまでスキップ
          while (i < valuesStr.length && valuesStr[i] !== ",") i++
          if (i < valuesStr.length) i++ // カンマをスキップ
          while (i < valuesStr.length && valuesStr[i] === " ") i++ // 空白をスキップ
        }
      } else if (char === "," && !inQuotes) {
        // フィールドの区切り
        const trimmed = current.trim()
        if (trimmed === "NULL") {
          values.push(null)
        } else if (!isNaN(Number(trimmed))) {
          values.push(Number(trimmed))
        } else {
          values.push(trimmed)
        }
        current = ""
        i++
        while (i < valuesStr.length && valuesStr[i] === " ") i++ // 空白をスキップ
      } else if (inQuotes) {
        current += char
        i++
      } else {
        current += char
        i++
      }
    }

    // 最後の値を処理
    if (current.trim()) {
      const trimmed = current.trim()
      if (trimmed === "NULL") {
        values.push(null)
      } else if (!isNaN(Number(trimmed))) {
        values.push(Number(trimmed))
      } else {
        values.push(trimmed)
      }
    }

    return values
  }
}

// シングルトンインスタンス

export const dataParserService = new DataParserService()
