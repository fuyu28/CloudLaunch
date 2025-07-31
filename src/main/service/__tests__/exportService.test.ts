/**
 * @fileoverview exportService.tsのテスト
 *
 * データエクスポートサービスの動作をテストします。
 * - データ取得とフォーマット変換
 * - CSV、JSON、SQL形式での出力
 * - エクスポート統計の取得
 */

/// <reference types="jest" />

import type { ExportOptions } from "../../ipcHandlers/dataExportHandlers"
import { ExportService } from "../exportService"
// モックされたPrismaクライアント
const mockDb = {
  game: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  playSession: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  upload: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  chapter: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  memo: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}

// Prismaクライアントをモック
jest.mock("../../db", () => ({
  prisma: mockDb
}))

describe("ExportService", () => {
  let exportService: ExportService

  beforeEach(() => {
    jest.clearAllMocks()
    exportService = new ExportService()
  })

  describe("getExportStats", () => {
    it("正常に統計情報を取得できる", async () => {
      mockDb.game.count.mockResolvedValue(10)
      mockDb.playSession.count.mockResolvedValue(50)
      mockDb.upload.count.mockResolvedValue(5)
      mockDb.chapter.count.mockResolvedValue(20)
      mockDb.memo.count.mockResolvedValue(15)

      const stats = await exportService.getExportStats()

      expect(stats).toEqual({
        gamesCount: 10,
        playSessionsCount: 50,
        uploadsCount: 5,
        chaptersCount: 20,
        memosCount: 15
      })

      expect(mockDb.game.count).toHaveBeenCalledTimes(1)
      expect(mockDb.playSession.count).toHaveBeenCalledTimes(1)
      expect(mockDb.upload.count).toHaveBeenCalledTimes(1)
      expect(mockDb.chapter.count).toHaveBeenCalledTimes(1)
      expect(mockDb.memo.count).toHaveBeenCalledTimes(1)
    })
  })

  describe("exportData", () => {
    const mockGameData = {
      id: "1",
      title: "Test Game",
      publisher: "Test Publisher",
      createdAt: new Date("2024-01-01T00:00:00.000Z")
    }

    const mockPlaySessionData = {
      id: "1",
      gameId: "1",
      duration: 3600,
      playedAt: new Date("2024-01-01T12:00:00.000Z")
    }

    beforeEach(() => {
      mockDb.game.findMany.mockResolvedValue([mockGameData])
      mockDb.playSession.findMany.mockResolvedValue([mockPlaySessionData])
      mockDb.upload.findMany.mockResolvedValue([])
      mockDb.chapter.findMany.mockResolvedValue([])
      mockDb.memo.findMany.mockResolvedValue([])
    })

    describe("JSON形式", () => {
      it("正常にJSONデータをエクスポートできる", async () => {
        const options: ExportOptions = {
          format: "json",
          includeGames: true,
          includePlaySessions: true
        }

        const result = await exportService.exportData(options)
        const parsedResult = JSON.parse(result)

        expect(parsedResult).toHaveProperty("exportedAt")
        expect(parsedResult).toHaveProperty("version", "1.0")
        expect(parsedResult.data).toHaveProperty("games")
        expect(parsedResult.data).toHaveProperty("playSessions")
        expect(parsedResult.data.games).toEqual([mockGameData])
        expect(parsedResult.data.playSessions).toEqual([mockPlaySessionData])
      })
    })

    describe("CSV形式", () => {
      it("正常にCSVデータをエクスポートできる", async () => {
        const options: ExportOptions = {
          format: "csv",
          includeGames: true,
          includePlaySessions: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain("# GAMES")
        expect(result).toContain("id,title,publisher,createdAt")
        expect(result).toContain("1,Test Game,Test Publisher,2024-01-01T00:00:00.000Z")

        expect(result).toContain("# PLAYSESSIONS")
        expect(result).toContain("id,gameId,duration,playedAt")
        expect(result).toContain("1,1,3600,2024-01-01T12:00:00.000Z")
      })

      it("カンマを含む文字列を適切にエスケープする", async () => {
        const gameWithComma = {
          ...mockGameData,
          title: "Test, Game With Comma",
          publisher: 'Test "Publisher"'
        }
        mockDb.game.findMany.mockResolvedValue([gameWithComma])

        const options: ExportOptions = {
          format: "csv",
          includeGames: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain('"Test, Game With Comma"')
        expect(result).toContain('"Test ""Publisher"""')
      })

      it("null値を空文字として出力する", async () => {
        const gameWithNull = {
          ...mockGameData,
          publisher: null
        }
        mockDb.game.findMany.mockResolvedValue([gameWithNull])

        const options: ExportOptions = {
          format: "csv",
          includeGames: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain("1,Test Game,,2024-01-01T00:00:00.000Z")
      })
    })

    describe("SQL形式", () => {
      it("正常にSQLデータをエクスポートできる", async () => {
        const options: ExportOptions = {
          format: "sql",
          includeGames: true,
          includePlaySessions: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain("-- CloudLaunch データエクスポート")
        expect(result).toContain("-- GAMES テーブル")
        expect(result).toContain(
          "INSERT INTO games (id, title, publisher, createdAt) VALUES ('1', 'Test Game', 'Test Publisher', '2024-01-01T00:00:00.000Z');"
        )

        expect(result).toContain("-- PLAYSESSIONS テーブル")
        expect(result).toContain(
          "INSERT INTO playSessions (id, gameId, duration, playedAt) VALUES ('1', '1', 3600, '2024-01-01T12:00:00.000Z');"
        )
      })

      it("null値をNULLとして出力する", async () => {
        const gameWithNull = {
          ...mockGameData,
          publisher: null
        }
        mockDb.game.findMany.mockResolvedValue([gameWithNull])

        const options: ExportOptions = {
          format: "sql",
          includeGames: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain(
          "INSERT INTO games (id, title, publisher, createdAt) VALUES ('1', 'Test Game', NULL, '2024-01-01T00:00:00.000Z');"
        )
      })

      it("シングルクォートを適切にエスケープする", async () => {
        const gameWithQuote = {
          ...mockGameData,
          title: "Test's Game"
        }
        mockDb.game.findMany.mockResolvedValue([gameWithQuote])

        const options: ExportOptions = {
          format: "sql",
          includeGames: true
        }

        const result = await exportService.exportData(options)

        expect(result).toContain("'Test''s Game'")
      })
    })

    describe("選択的エクスポート", () => {
      it("指定されたテーブルのみをエクスポートする", async () => {
        const options: ExportOptions = {
          format: "json",
          includeGames: true,
          includePlaySessions: false,
          includeUploads: false,
          includeChapters: false,
          includeMemos: false
        }

        const result = await exportService.exportData(options)
        const parsedResult = JSON.parse(result)

        expect(parsedResult.data).toHaveProperty("games")
        expect(parsedResult.data).not.toHaveProperty("playSessions")
        expect(parsedResult.data).not.toHaveProperty("uploads")
        expect(parsedResult.data).not.toHaveProperty("chapters")
        expect(parsedResult.data).not.toHaveProperty("memos")

        expect(mockDb.game.findMany).toHaveBeenCalledTimes(1)
        expect(mockDb.playSession.findMany).not.toHaveBeenCalled()
        expect(mockDb.upload.findMany).not.toHaveBeenCalled()
        expect(mockDb.chapter.findMany).not.toHaveBeenCalled()
        expect(mockDb.memo.findMany).not.toHaveBeenCalled()
      })
    })

    describe("エラーハンドリング", () => {
      it("サポートされていない形式でエラーを投げる", async () => {
        const options: ExportOptions = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          format: "xml" as any,
          includeGames: true
        }

        await expect(exportService.exportData(options)).rejects.toThrow(
          "サポートされていない形式です: xml"
        )
      })
    })
  })
})
