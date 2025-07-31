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
import type { ExportOptions } from "../dataExportHandlers"
import { handleDataExport, handleGetExportStats } from "../dataExportHandlers"

// モック
jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn()
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
    getExportStats: jest.fn()
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
})
