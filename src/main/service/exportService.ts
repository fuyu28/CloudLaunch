/**
 * @fileoverview データエクスポート機能のサービスクラス
 * データベースの全データをCSV、JSON、SQL形式でエクスポートする
 */

import { prisma as db } from "../db"
import type {
  ExportOptions,
  ImportOptions,
  ImportResult,
  ImportFormat
} from "../ipcHandlers/dataExportHandlers"

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

  /**
   * ファイル内容からデータをインポート
   * @param fileContent ファイルの内容
   * @param options インポートオプション
   * @returns インポート結果
   */
  async importData(fileContent: string, options: ImportOptions): Promise<ImportResult> {
    let data: Record<string, unknown[]>

    try {
      // ファイル形式に応じてデータを解析
      switch (options.format) {
        case "json":
          data = this.parseJSONImport(fileContent)
          break
        case "csv":
          data = this.parseCSVImport(fileContent)
          break
        case "sql":
          data = this.parseSQLImport(fileContent)
          break
        default:
          throw new Error(`サポートされていない形式です: ${options.format}`)
      }

      // データをデータベースにインポート
      return await this.importToDatabase(data, options)
    } catch (error) {
      return {
        totalRecords: 0,
        successfulImports: 0,
        skippedRecords: 0,
        errors: [
          {
            table: "unknown",
            record: {},
            error: error instanceof Error ? error.message : "インポートに失敗しました"
          }
        ]
      }
    }
  }

  /**
   * インポートファイルの内容を分析
   * @param fileContent ファイルの内容
   * @param format ファイル形式
   * @returns 分析結果
   */
  async analyzeImportFile(
    fileContent: string,
    format: ImportFormat | null
  ): Promise<{
    recordCounts: Record<string, number>
    hasValidStructure: boolean
  }> {
    try {
      let data: Record<string, unknown[]>

      if (!format) {
        return {
          recordCounts: {},
          hasValidStructure: false
        }
      }

      switch (format) {
        case "json":
          data = this.parseJSONImport(fileContent)
          break
        case "csv":
          data = this.parseCSVImport(fileContent)
          break
        case "sql":
          data = this.parseSQLImport(fileContent)
          break
        default:
          return {
            recordCounts: {},
            hasValidStructure: false
          }
      }

      const recordCounts: Record<string, number> = {}
      for (const [tableName, records] of Object.entries(data)) {
        recordCounts[tableName] = Array.isArray(records) ? records.length : 0
      }

      return {
        recordCounts,
        hasValidStructure: Object.keys(recordCounts).length > 0
      }
    } catch {
      return {
        recordCounts: {},
        hasValidStructure: false
      }
    }
  }

  /**
   * JSONファイルの内容を解析
   */
  private parseJSONImport(fileContent: string): Record<string, unknown[]> {
    const parsed = JSON.parse(fileContent)

    // CloudLaunchエクスポート形式を検出
    if (parsed.data && typeof parsed.data === "object") {
      return parsed.data as Record<string, unknown[]>
    }

    // 直接データ形式の場合
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown[]>
    }

    throw new Error("有効なJSON形式ではありません")
  }

  /**
   * CSVファイルの内容を解析
   */
  private parseCSVImport(fileContent: string): Record<string, unknown[]> {
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
          data[currentTable].push(record)
        }
      }
    }

    if (Object.keys(data).length === 0) {
      throw new Error("有効なCSV形式ではありません")
    }

    return data
  }

  /**
   * CSV行をパース（引用符とエスケープを考慮）
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
   * SQLファイルの内容を解析
   */
  private parseSQLImport(fileContent: string): Record<string, unknown[]> {
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
          data[tableName].push(record)
        }
      }
    }

    if (Object.keys(data).length === 0) {
      throw new Error("有効なSQL形式ではありません")
    }

    return data
  }

  /**
   * SQL VALUES句をパース
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

  /**
   * データをデータベースにインポート
   */
  private async importToDatabase(
    data: Record<string, unknown[]>,
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRecords: 0,
      successfulImports: 0,
      skippedRecords: 0,
      errors: []
    }

    // トランザクション内で実行
    return await db.$transaction(async (tx) => {
      // テーブルごとに処理
      for (const [tableName, records] of Object.entries(data)) {
        if (!Array.isArray(records)) continue

        // インポート対象のテーブルかチェック
        if (!this.shouldImportTable(tableName, options)) continue

        for (const record of records) {
          result.totalRecords++

          try {
            const success = await this.importRecord(
              tx,
              tableName,
              record as Record<string, unknown>,
              options
            )
            if (success) {
              result.successfulImports++
            } else {
              result.skippedRecords++
            }
          } catch (error) {
            result.errors.push({
              table: tableName,
              record,
              error: error instanceof Error ? error.message : "不明なエラー"
            })
          }
        }
      }

      return result
    })
  }

  /**
   * テーブルがインポート対象かチェック
   */
  private shouldImportTable(tableName: string, options: ImportOptions): boolean {
    switch (tableName.toLowerCase()) {
      case "games":
        return options.includeGames !== false
      case "playsessions":
        return options.includePlaySessions !== false
      case "uploads":
        return options.includeUploads !== false
      case "chapters":
        return options.includeChapters !== false
      case "memos":
        return options.includeMemos !== false
      default:
        return false
    }
  }

  /**
   * 個別レコードをインポート
   */
  private async importRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    tableName: string,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const tableNameLower = tableName.toLowerCase()

    try {
      switch (tableNameLower) {
        case "games":
          return await this.importGameRecord(tx, record, options)
        case "playsessions":
          return await this.importPlaySessionRecord(tx, record, options)
        case "uploads":
          return await this.importUploadRecord(tx, record, options)
        case "chapters":
          return await this.importChapterRecord(tx, record, options)
        case "memos":
          return await this.importMemoRecord(tx, record, options)
        default:
          return false
      }
    } catch (error) {
      console.error(`レコードインポートエラー (${tableName}):`, error)
      throw error
    }
  }

  /**
   * ゲームレコードをインポート
   */
  private async importGameRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const id = String(record.id)

    // 既存レコードをチェック
    const existing = await tx.game.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace") {
        await tx.game.update({
          where: { id },
          data: {
            title: String(record.title || ""),
            publisher: String(record.publisher || ""),
            imagePath: record.imagePath ? String(record.imagePath) : null,
            exePath: String(record.exePath || ""),
            saveFolderPath: record.saveFolderPath ? String(record.saveFolderPath) : null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            playStatus: (record.playStatus as any) || "unplayed",
            totalPlayTime: Number(record.totalPlayTime) || 0,
            lastPlayed: record.lastPlayed ? new Date(String(record.lastPlayed)) : null,
            clearedAt: record.clearedAt ? new Date(String(record.clearedAt)) : null,
            currentChapter: record.currentChapter ? String(record.currentChapter) : null
          }
        })
        return true
      } else if (options.mode === "merge") {
        // mergeモードの場合は既存データを更新
        await tx.game.update({
          where: { id },
          data: {
            title: String(record.title || ""),
            publisher: String(record.publisher || ""),
            imagePath: record.imagePath ? String(record.imagePath) : null,
            exePath: String(record.exePath || ""),
            saveFolderPath: record.saveFolderPath ? String(record.saveFolderPath) : null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            playStatus: (record.playStatus as any) || "unplayed",
            totalPlayTime: Number(record.totalPlayTime) || 0,
            lastPlayed: record.lastPlayed ? new Date(String(record.lastPlayed)) : null,
            clearedAt: record.clearedAt ? new Date(String(record.clearedAt)) : null,
            currentChapter: record.currentChapter ? String(record.currentChapter) : null
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.game.create({
      data: {
        id,
        title: String(record.title || ""),
        publisher: String(record.publisher || ""),
        imagePath: record.imagePath ? String(record.imagePath) : null,
        exePath: String(record.exePath || ""),
        saveFolderPath: record.saveFolderPath ? String(record.saveFolderPath) : null,
        createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        playStatus: (record.playStatus as any) || "unplayed",
        totalPlayTime: Number(record.totalPlayTime) || 0,
        lastPlayed: record.lastPlayed ? new Date(String(record.lastPlayed)) : null,
        clearedAt: record.clearedAt ? new Date(String(record.clearedAt)) : null,
        currentChapter: record.currentChapter ? String(record.currentChapter) : null
      }
    })

    return true
  }

  /**
   * プレイセッションレコードをインポート
   */
  private async importPlaySessionRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const id = String(record.id)
    const gameId = String(record.gameId)

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })
    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.playSession.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.playSession.update({
          where: { id },
          data: {
            gameId,
            playedAt: record.playedAt ? new Date(String(record.playedAt)) : new Date(),
            duration: Number(record.duration) || 0,
            sessionName: record.sessionName ? String(record.sessionName) : null,
            chapterId: record.chapterId ? String(record.chapterId) : null,
            uploadId: record.uploadId ? String(record.uploadId) : null
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.playSession.create({
      data: {
        id,
        gameId,
        playedAt: record.playedAt ? new Date(String(record.playedAt)) : new Date(),
        duration: Number(record.duration) || 0,
        sessionName: record.sessionName ? String(record.sessionName) : null,
        chapterId: record.chapterId ? String(record.chapterId) : null,
        uploadId: record.uploadId ? String(record.uploadId) : null
      }
    })

    return true
  }

  /**
   * アップロードレコードをインポート
   */
  private async importUploadRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const id = String(record.id)
    const gameId = String(record.gameId)

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })
    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.upload.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.upload.update({
          where: { id },
          data: {
            gameId,
            clientId: record.clientId ? String(record.clientId) : null,
            comment: String(record.comment || ""),
            createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date()
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.upload.create({
      data: {
        id,
        gameId,
        clientId: record.clientId ? String(record.clientId) : null,
        comment: String(record.comment || ""),
        createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date()
      }
    })

    return true
  }

  /**
   * チャプターレコードをインポート
   */
  private async importChapterRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const id = String(record.id)
    const gameId = String(record.gameId)

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })
    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.chapter.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.chapter.update({
          where: { id },
          data: {
            gameId,
            name: String(record.name || ""),
            order: Number(record.order) || 0,
            createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date()
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.chapter.create({
      data: {
        id,
        gameId,
        name: String(record.name || ""),
        order: Number(record.order) || 0,
        createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date()
      }
    })

    return true
  }

  /**
   * メモレコードをインポート
   */
  private async importMemoRecord(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const id = String(record.id)
    const gameId = String(record.gameId)

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })
    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.memo.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.memo.update({
          where: { id },
          data: {
            gameId,
            title: String(record.title || ""),
            content: String(record.content || ""),
            createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date(),
            updatedAt: record.updatedAt ? new Date(String(record.updatedAt)) : new Date()
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.memo.create({
      data: {
        id,
        gameId,
        title: String(record.title || ""),
        content: String(record.content || ""),
        createdAt: record.createdAt ? new Date(String(record.createdAt)) : new Date(),
        updatedAt: record.updatedAt ? new Date(String(record.updatedAt)) : new Date()
      }
    })

    return true
  }
}

export const exportService = new ExportService()
