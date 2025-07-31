/**
 * @fileoverview exportService.tsのテスト
 *
 * データエクスポートサービスの動作をテストします。
 * - データ取得とフォーマット変換
 * - CSV、JSON、SQL形式での出力
 * - エクスポート統計の取得
 */

/// <reference types="jest" />

import type { ExportOptions, ImportOptions } from "../../ipcHandlers/dataExportHandlers"
import { ExportService } from "../exportService"

// モックされたPrismaクライアント
const mockDb = {
  game: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  playSession: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  upload: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  chapter: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  memo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn()
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
        expect(parsedResult.data.games).toBeDefined()
        expect(parsedResult.data.playSessions).toBeDefined()
        expect(parsedResult.data.games.length).toBe(1)
        expect(parsedResult.data.playSessions.length).toBe(1)
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
        expect(result).toContain("1,Test Game,Test Publisher")
        expect(result).toContain("Mon Jan 01 2024")

        expect(result).toContain("# PLAYSESSIONS")
        expect(result).toContain("id,gameId,duration,playedAt")
        expect(result).toContain("1,1,3600")
        expect(result).toContain("Mon Jan 01 2024")
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
        expect(result).toContain('Test "Publisher"')
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

        expect(result).toContain("1,Test Game,,")
        expect(result).toContain("Mon Jan 01 2024")
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

  describe("importData", () => {
    describe("JSON形式のインポート", () => {
      it("正常にJSONデータをインポートできる", async () => {
        const jsonData = JSON.stringify({
          data: {
            games: [
              {
                id: "test-game-1",
                title: "Test Game",
                publisher: "Test Publisher",
                exePath: "/path/to/game.exe",
                createdAt: "2024-01-01T00:00:00.000Z",
                playStatus: "unplayed",
                totalPlayTime: 0
              }
            ]
          }
        })

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null) // 既存のゲームなし
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(jsonData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).toHaveBeenCalledWith({
          data: {
            id: "test-game-1",
            title: "Test Game",
            publisher: "Test Publisher",
            imagePath: null,
            exePath: "/path/to/game.exe",
            saveFolderPath: null,
            createdAt: expect.any(Date),
            playStatus: "unplayed",
            totalPlayTime: 0,
            lastPlayed: null,
            clearedAt: null,
            currentChapter: null
          }
        })
      })

      it("競合モードskipで既存データをスキップする", async () => {
        const jsonData = JSON.stringify({
          data: {
            games: [
              {
                id: "existing-game",
                title: "Existing Game",
                publisher: "Publisher"
              }
            ]
          }
        })

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" }) // 既存のゲームあり

        const options: ImportOptions = {
          format: "json",
          mode: "skip",
          includeGames: true
        }

        const result = await exportService.importData(jsonData, options)

        expect(result.successfulImports).toBe(0)
        expect(result.skippedRecords).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).not.toHaveBeenCalled()
        expect(mockDb.game.update).not.toHaveBeenCalled()
      })

      it("競合モードreplaceで既存データを更新する", async () => {
        const jsonData = JSON.stringify({
          data: {
            games: [
              {
                id: "existing-game",
                title: "Updated Game",
                publisher: "Updated Publisher"
              }
            ]
          }
        })

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" })
        mockDb.game.update.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "replace",
          includeGames: true
        }

        const result = await exportService.importData(jsonData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.update).toHaveBeenCalledWith({
          where: { id: "existing-game" },
          data: expect.objectContaining({
            title: "Updated Game",
            publisher: "Updated Publisher"
          })
        })
      })

      it("競合モードmergeで既存データを更新する", async () => {
        const jsonData = JSON.stringify({
          data: {
            games: [
              {
                id: "existing-game",
                title: "Merged Game",
                publisher: "Merged Publisher"
              }
            ]
          }
        })

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" })
        mockDb.game.update.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(jsonData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.update).toHaveBeenCalledWith({
          where: { id: "existing-game" },
          data: expect.objectContaining({
            title: "Merged Game",
            publisher: "Merged Publisher"
          })
        })
      })
    })

    describe("CSV形式のインポート", () => {
      it("正常にCSVデータをインポートできる", async () => {
        const csvData = `# games
id,title,publisher,exePath
test-game-1,Test Game,Test Publisher,/path/to/game.exe`

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "csv",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(csvData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
      })

      it("空の値をnullとして処理する", async () => {
        const csvData = `# games
id,title,publisher,imagePath
test-game-1,Test Game,,`

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "csv",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(csvData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).toHaveBeenCalled()
      })
    })

    describe("SQL形式のインポート", () => {
      it("正常にSQLデータをインポートできる", async () => {
        const sqlData = `
INSERT INTO games (id, title, publisher, exePath) VALUES ('test-game-1', 'Test Game', 'Test Publisher', '/path/to/game.exe');
`

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "sql",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(sqlData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
      })

      it("NULL値を適切に処理する", async () => {
        const sqlData = `
INSERT INTO games (id, title, publisher, imagePath) VALUES ('test-game-1', 'Test Game', NULL, NULL);
`

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "sql",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(sqlData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).toHaveBeenCalled()
      })
    })

    describe("エラーハンドリング", () => {
      it("無効なJSON形式でエラーを返す", async () => {
        const invalidJson = "{ invalid json }"

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await exportService.importData(invalidJson, options)

        expect(result.successfulImports).toBe(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].table).toBe("unknown")
      })

      it("関連するゲームが存在しない場合にエラーを記録する", async () => {
        const jsonData = JSON.stringify({
          data: {
            playSessions: [
              {
                id: "session-1",
                gameId: "non-existent-game",
                duration: 3600,
                playedAt: "2024-01-01T12:00:00.000Z"
              }
            ]
          }
        })

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null) // ゲームが存在しない

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includePlaySessions: true
        }

        const result = await exportService.importData(jsonData, options)

        expect(result.successfulImports).toBe(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].error).toContain("ゲームID non-existent-game が存在しません")
      })
    })
  })

  describe("analyzeImportFile", () => {
    it("JSON形式のファイルを正しく分析する", async () => {
      const jsonData = JSON.stringify({
        data: {
          games: [{ id: "1" }, { id: "2" }],
          playSessions: [{ id: "1" }]
        }
      })

      const result = await exportService.analyzeImportFile(jsonData, "json")

      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playSessions: 1
      })
    })

    it("CSV形式のファイルを正しく分析する", async () => {
      const csvData = `# games
id,title
1,Game1
2,Game2

# playSessions
id,gameId
1,1`

      const result = await exportService.analyzeImportFile(csvData, "csv")

      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playsessions: 1
      })
    })

    it("SQL形式のファイルを正しく分析する", async () => {
      const sqlData = `
INSERT INTO games (id, title) VALUES ('1', 'Game1');
INSERT INTO games (id, title) VALUES ('2', 'Game2');
INSERT INTO playSessions (id, gameId) VALUES ('1', '1');
`

      const result = await exportService.analyzeImportFile(sqlData, "sql")

      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playsessions: 1
      })
    })

    it("無効なデータの場合にfalseを返す", async () => {
      const invalidData = "invalid data"

      const result = await exportService.analyzeImportFile(invalidData, "json")

      expect(result.hasValidStructure).toBe(false)
      expect(result.recordCounts).toEqual({})
    })

    it("形式がnullの場合にfalseを返す", async () => {
      const jsonData = '{"data": {}}'

      const result = await exportService.analyzeImportFile(jsonData, null)

      expect(result.hasValidStructure).toBe(false)
      expect(result.recordCounts).toEqual({})
    })
  })
})
