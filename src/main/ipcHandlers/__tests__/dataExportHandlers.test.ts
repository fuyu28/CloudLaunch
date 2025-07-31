/**
 * @fileoverview dataExportHandlers.tsのテスト
 *
 * データエクスポート機能のIPCハンドラーの動作をテストします。
 * - エクスポート統計の取得
 * - データエクスポート（CSV、JSON、SQL形式）
 * - ファイル保存の確認
 */

/// <reference types="jest" />

import { promises as fs } from "fs"
import path from "path"

import { dialog } from "electron"

import { exportService } from "../../service/exportService"
import type { ExportOptions, ImportOptions } from "../dataExportHandlers"
import {
  handleDataExport,
  handleGetExportStats,
  handleDataImport,
  handleAnalyzeImportFile
} from "../dataExportHandlers"

// モック
jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}))

jest.mock("electron", () => ({
  dialog: {
    showOpenDialog: jest.fn()
  }
}))

jest.mock("../../service/exportService", () => ({
  exportService: {
    exportData: jest.fn(),
    getExportStats: jest.fn(),
    importData: jest.fn(),
    analyzeImportFile: jest.fn()
  }
}))

jest.mock("../../utils/notification", () => ({
  showNotification: jest.fn()
}))

const mockFs = fs as jest.Mocked<typeof fs>
const mockDialog = dialog as jest.Mocked<typeof dialog>
const mockExportService = exportService as jest.Mocked<typeof exportService>

describe("dataExportHandlers", () => {
  // モックイベント
  const mockEvent = {} as Electron.IpcMainInvokeEvent

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("handleGetExportStats", () => {
    it("正常にエクスポート統計を取得できる", async () => {
      const mockStats = {
        gamesCount: 10,
        playSessionsCount: 50,
        uploadsCount: 5,
        chaptersCount: 20,
        memosCount: 15
      }

      mockExportService.getExportStats.mockResolvedValue(mockStats)

      const result = await handleGetExportStats()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockStats)
      }
      expect(mockExportService.getExportStats).toHaveBeenCalledTimes(1)
    })

    it("エラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockError = new Error("統計取得エラー")
      mockExportService.getExportStats.mockRejectedValue(mockError)

      const result = await handleGetExportStats()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("統計取得エラー")
      }
    })
  })

  describe("handleDataExport", () => {
    const mockExportOptions: ExportOptions = {
      format: "json",
      includeGames: true,
      includePlaySessions: true,
      includeUploads: false,
      includeChapters: true,
      includeMemos: true
    }

    it("正常にJSONデータをエクスポートできる", async () => {
      const mockExportData = '{"games": [], "playSessions": []}'
      const mockFolderPath = "/mock/export/folder"
      const mockFilePath = path.join(
        mockFolderPath,
        "cloudlaunch_export_2024-01-01T09-00-00-000Z.json"
      )

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFolderPath]
      })

      mockExportService.exportData.mockResolvedValue(mockExportData)
      mockFs.writeFile.mockResolvedValue(undefined)

      // 時間を固定（JST対応）
      jest
        .spyOn(Date.prototype, "getTime")
        .mockReturnValue(new Date("2024-01-01T00:00:00.000Z").getTime())
      jest.spyOn(Date.prototype, "toISOString").mockReturnValue("2024-01-01T09:00:00.000Z")

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(mockFilePath)
      }
      expect(mockExportService.exportData).toHaveBeenCalledWith(mockExportOptions)
      expect(mockFs.writeFile).toHaveBeenCalledWith(mockFilePath, mockExportData, "utf8")
    })

    it("CSVデータをエクスポートできる", async () => {
      const mockExportOptions: ExportOptions = {
        format: "csv",
        includeGames: true
      }
      const mockExportData = "id,title,publisher\n1,Game1,Publisher1"
      const mockFolderPath = "/mock/export/folder"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFolderPath]
      })

      mockExportService.exportData.mockResolvedValue(mockExportData)
      mockFs.writeFile.mockResolvedValue(undefined)

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain(".csv")
      }
      expect(mockExportService.exportData).toHaveBeenCalledWith(mockExportOptions)
    })

    it("SQLデータをエクスポートできる", async () => {
      const mockExportOptions: ExportOptions = {
        format: "sql",
        includeGames: true
      }
      const mockExportData = "INSERT INTO games (id, title) VALUES (1, 'Game1');"
      const mockFolderPath = "/mock/export/folder"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFolderPath]
      })

      mockExportService.exportData.mockResolvedValue(mockExportData)
      mockFs.writeFile.mockResolvedValue(undefined)

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain(".sql")
      }
      expect(mockExportService.exportData).toHaveBeenCalledWith(mockExportOptions)
    })

    it("ダイアログがキャンセルされた場合にエラーレスポンスを返す", async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      })

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("フォルダの選択がキャンセルされました")
      }
      expect(mockExportService.exportData).not.toHaveBeenCalled()
      expect(mockFs.writeFile).not.toHaveBeenCalled()
    })

    it("ファイル書き込みでエラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockExportData = '{"games": []}'
      const mockFolderPath = "/mock/export/folder"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFolderPath]
      })

      mockExportService.exportData.mockResolvedValue(mockExportData)
      mockFs.writeFile.mockRejectedValue(new Error("書き込みエラー"))

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("書き込みエラー")
      }
    })

    it("エクスポートサービスでエラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockFolderPath = "/mock/export/folder"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFolderPath]
      })

      mockExportService.exportData.mockRejectedValue(new Error("エクスポートエラー"))

      const result = await handleDataExport(mockEvent, mockExportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("エクスポートエラー")
      }
      expect(mockFs.writeFile).not.toHaveBeenCalled()
    })
  })

  describe("handleDataImport", () => {
    const mockImportOptions: ImportOptions = {
      format: "json",
      mode: "merge",
      includeGames: true,
      includePlaySessions: true
    }

    it("正常にJSONデータをインポートできる", async () => {
      const mockImportResult = {
        totalRecords: 5,
        successfulImports: 4,
        skippedRecords: 1,
        errors: []
      }
      const mockFilePath = "/mock/import/data.json"
      const mockFileContent = '{"data": {"games": []}}'

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.importData.mockResolvedValue(mockImportResult)

      const result = await handleDataImport(mockEvent, mockImportOptions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockImportResult)
      }
      expect(mockExportService.importData).toHaveBeenCalledWith(mockFileContent, mockImportOptions)
      expect(mockFs.readFile).toHaveBeenCalledWith(mockFilePath, "utf8")
    })

    it("CSVデータをインポートできる", async () => {
      const mockImportOptions: ImportOptions = {
        format: "csv",
        mode: "replace",
        includeGames: true
      }
      const mockImportResult = {
        totalRecords: 3,
        successfulImports: 3,
        skippedRecords: 0,
        errors: []
      }
      const mockFilePath = "/mock/import/data.csv"
      const mockFileContent = "# games\nid,title\n1,Game1"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.importData.mockResolvedValue(mockImportResult)

      const result = await handleDataImport(mockEvent, mockImportOptions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockImportResult)
      }
      expect(mockExportService.importData).toHaveBeenCalledWith(mockFileContent, mockImportOptions)
    })

    it("ダイアログがキャンセルされた場合にエラーレスポンスを返す", async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      })

      const result = await handleDataImport(mockEvent, mockImportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("ファイルの選択がキャンセルされました")
      }
      expect(mockExportService.importData).not.toHaveBeenCalled()
      expect(mockFs.readFile).not.toHaveBeenCalled()
    })

    it("ファイル読み込みでエラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockFilePath = "/mock/import/data.json"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockRejectedValue(new Error("ファイル読み込みエラー"))

      const result = await handleDataImport(mockEvent, mockImportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("ファイル読み込みエラー")
      }
      expect(mockExportService.importData).not.toHaveBeenCalled()
    })

    it("インポートサービスでエラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockFilePath = "/mock/import/data.json"
      const mockFileContent = '{"data": {}}'

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.importData.mockRejectedValue(new Error("インポートエラー"))

      const result = await handleDataImport(mockEvent, mockImportOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("インポートエラー")
      }
    })
  })

  describe("handleAnalyzeImportFile", () => {
    it("正常にファイルを分析できる", async () => {
      const mockAnalysisResult = {
        format: "json" as const,
        recordCounts: { games: 5, playSessions: 10 },
        hasValidStructure: true
      }
      const mockFilePath = "/mock/import/data.json"
      const mockFileContent = '{"data": {"games": [], "playSessions": []}}'

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.analyzeImportFile.mockResolvedValue(mockAnalysisResult)

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.format).toBe("json")
        expect(result.data.recordCounts).toEqual({ games: 5, playSessions: 10 })
        expect(result.data.hasValidStructure).toBe(true)
      }
      expect(mockExportService.analyzeImportFile).toHaveBeenCalledWith(mockFileContent, "json")
    })

    it("ファイル拡張子からCSV形式を判定する", async () => {
      const mockAnalysisResult = {
        recordCounts: { games: 3 },
        hasValidStructure: true
      }
      const mockFilePath = "/mock/import/data.csv"
      const mockFileContent = "# games\nid,title\n1,Game1"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.analyzeImportFile.mockResolvedValue(mockAnalysisResult)

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.format).toBe("csv")
      }
      expect(mockExportService.analyzeImportFile).toHaveBeenCalledWith(mockFileContent, "csv")
    })

    it("ファイル拡張子からSQL形式を判定する", async () => {
      const mockAnalysisResult = {
        recordCounts: { games: 2 },
        hasValidStructure: true
      }
      const mockFilePath = "/mock/import/data.sql"
      const mockFileContent = "INSERT INTO games (id) VALUES (1);"

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.analyzeImportFile.mockResolvedValue(mockAnalysisResult)

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.format).toBe("sql")
      }
      expect(mockExportService.analyzeImportFile).toHaveBeenCalledWith(mockFileContent, "sql")
    })

    it("内容からJSON形式を推測する", async () => {
      const mockAnalysisResult = {
        recordCounts: { games: 1 },
        hasValidStructure: true
      }
      const mockFilePath = "/mock/import/data.txt"
      const mockFileContent = '{"data": {"games": []}}'

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.analyzeImportFile.mockResolvedValue(mockAnalysisResult)

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.format).toBe("json")
      }
    })

    it("ダイアログがキャンセルされた場合にエラーレスポンスを返す", async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      })

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("ファイルの選択がキャンセルされました")
      }
      expect(mockExportService.analyzeImportFile).not.toHaveBeenCalled()
    })

    it("ファイル分析でエラーが発生した場合にエラーレスポンスを返す", async () => {
      const mockFilePath = "/mock/import/data.json"
      const mockFileContent = '{"invalid": json}'

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mockFs.readFile as any).mockResolvedValue(mockFileContent)
      mockExportService.analyzeImportFile.mockRejectedValue(new Error("分析エラー"))

      const result = await handleAnalyzeImportFile()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toBe("分析エラー")
      }
    })
  })
})
