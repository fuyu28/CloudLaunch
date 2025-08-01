/**
 * @fileoverview importService.tsのテスト
 *
 * データインポートサービスの動作をテストします。
 * トランザクション管理、エラーハンドリング、競合モードの動作を網羅しています。
 *
 * テスト対象：
 * - 解析済みデータのインポート処理
 * - トランザクション管理とエラーハンドリング
 * - 競合モード（skip/replace/merge）の動作
 * - バリデーション機能とテーブル選択機能
 */

/// <reference types="jest" />

import type { ImportOptions } from "../../ipcHandlers/dataExportHandlers"
import type { ParsedData } from "../dataParserService"
import { ImportService } from "../importService"

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

describe("ImportService", () => {
  let importService: ImportService

  beforeEach(() => {
    jest.clearAllMocks()
    importService = new ImportService()
  })

  describe("importData", () => {
    describe("ゲームレコードのインポート", () => {
      it("正常にゲームデータをインポートできる", async () => {
        const parsedData: ParsedData = {
          format: "json",
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
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null) // 既存のゲームなし
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: "test-game-1",
            title: "Test Game",
            publisher: "Test Publisher",
            exePath: "/path/to/game.exe"
          })
        })
      })

      it("競合モードskipで既存データをスキップする", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "existing-game",
                title: "Existing Game",
                publisher: "Publisher"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" }) // 既存のゲームあり

        const options: ImportOptions = {
          format: "json",
          mode: "skip",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(0)
        expect(result.skippedRecords).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.game.create).not.toHaveBeenCalled()
        expect(mockDb.game.update).not.toHaveBeenCalled()
      })

      it("競合モードreplaceで既存データを更新する", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "existing-game",
                title: "Updated Game",
                publisher: "Updated Publisher"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" })
        mockDb.game.update.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "replace",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

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
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "existing-game",
                title: "Merged Game",
                publisher: "Merged Publisher"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "existing-game" })
        mockDb.game.update.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

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

    describe("プレイセッションレコードのインポート", () => {
      it("正常にプレイセッションデータをインポートできる", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            playsessions: [
              {
                id: "session-1",
                gameId: "test-game-1",
                duration: 3600,
                playedAt: "2024-01-01T12:00:00.000Z"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue({ id: "test-game-1" }) // ゲームが存在
        mockDb.playSession.findUnique.mockResolvedValue(null) // 既存セッションなし
        mockDb.playSession.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includePlaySessions: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.skippedRecords).toBe(0)
        expect(result.errors).toHaveLength(0)
        expect(mockDb.playSession.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: "session-1",
            gameId: "test-game-1",
            duration: 3600
          })
        })
      })

      it("関連するゲームが存在しない場合にエラーを記録する", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            playsessions: [
              {
                id: "session-1",
                gameId: "non-existent-game",
                duration: 3600,
                playedAt: "2024-01-01T12:00:00.000Z"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null) // ゲームが存在しない

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includePlaySessions: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].error).toContain("ゲームID non-existent-game が存在しません")
      })
    })

    describe("エラーハンドリング", () => {
      it("バリデーションエラーでインポートを拒否する", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "test-game-1",
                // title が不足（必須フィールド）
                exePath: "/path/to/game.exe",
                totalPlayTime: -100 // 負の値（無効）
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].error).toContain("バリデーションエラー")
      })

      it("一部レコードのバリデーションエラーで他のレコードは処理を継続する", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "valid-game",
                title: "Valid Game",
                exePath: "/path/to/valid.exe"
              },
              {
                id: "invalid-game",
                // title が不足
                exePath: "/path/to/invalid.exe"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].error).toContain("バリデーションエラー")
      })
    })

    describe("テーブル選択機能", () => {
      it("指定されたテーブルのみをインポートする", async () => {
        const parsedData: ParsedData = {
          format: "json",
          data: {
            games: [
              {
                id: "test-game-1",
                title: "Test Game",
                exePath: "/path/to/game.exe"
              }
            ],
            playsessions: [
              {
                id: "session-1",
                gameId: "test-game-1",
                duration: 3600,
                playedAt: "2024-01-01T12:00:00.000Z"
              }
            ]
          }
        }

        mockDb.$transaction.mockImplementation((callback) => callback(mockDb))
        mockDb.game.findUnique.mockResolvedValue(null)
        mockDb.game.create.mockResolvedValue({})

        const options: ImportOptions = {
          format: "json",
          mode: "merge",
          includeGames: true,
          includePlaySessions: false
        }

        const result = await importService.importData(parsedData, options)

        expect(result.successfulImports).toBe(1)
        expect(result.totalRecords).toBe(1) // プレイセッションは処理されない
        expect(mockDb.game.create).toHaveBeenCalledTimes(1)
        expect(mockDb.playSession.create).not.toHaveBeenCalled()
      })
    })
  })
})
