/**
 * @fileoverview databaseHandlers.tsのテスト
 *
 * このファイルは、databaseHandlers.tsの各IPC通信ハンドラーの動作をテストします。
 * - ゲーム一覧取得（検索・フィルタ・ソート）
 * - ゲーム詳細取得
 * - ゲームの作成・更新・削除
 * - プレイセッション記録
 */

/// <reference types="jest" />

// Prismaのモック
const mockPrisma = {
  game: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  playSession: {
    create: jest.fn()
  },
  $transaction: jest.fn()
}

// モジュールをモック化
jest.mock("../../db", () => ({
  prisma: mockPrisma
}))

jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn()
  }
}))

import { ipcMain } from "electron"
import { registerDatabaseHandlers } from "../databaseHandlers"
import type { FilterOption, SortOption } from "../../../types/menu"

describe("databaseHandlers", () => {
  // モックされたIPC handlers
  let mockHandlers: { [key: string]: (...args: unknown[]) => unknown } = {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockHandlers = {}

    // ipcMain.handle のモックを設定
    ;(ipcMain.handle as jest.Mock).mockImplementation(
      (channel: string, handler: (...args: unknown[]) => unknown) => {
        mockHandlers[channel] = handler
      }
    )

    // ハンドラーを登録
    registerDatabaseHandlers()
  })

  describe("list-games", () => {
    const mockGames = [
      {
        id: "game1",
        title: "テストゲーム1",
        publisher: "テスト出版社1",
        playStatus: "unplayed",
        totalPlayTime: 0,
        lastPlayed: null
      },
      {
        id: "game2",
        title: "テストゲーム2",
        publisher: "テスト出版社2",
        playStatus: "playing",
        totalPlayTime: 3600,
        lastPlayed: new Date("2023-01-01")
      }
    ]

    it("検索なし、フィルタなし、ソートなしでゲーム一覧を取得できる", async () => {
      mockPrisma.game.findMany.mockResolvedValue(mockGames)

      const result = await mockHandlers["list-games"](
        {},
        "", // searchWord
        "all" as FilterOption,
        "title" as SortOption
      )

      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          AND: [{}, {}]
        },
        orderBy: { title: "asc" }
      })
      expect(result).toEqual(mockGames)
    })

    it("検索ワードでゲームを検索できる", async () => {
      mockPrisma.game.findMany.mockResolvedValue([mockGames[0]])

      const result = await mockHandlers["list-games"](
        {},
        "テストゲーム1",
        "all" as FilterOption,
        "title" as SortOption
      )

      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: "テストゲーム1" } },
                { publisher: { contains: "テストゲーム1" } }
              ]
            },
            {}
          ]
        },
        orderBy: { title: "asc" }
      })
      expect(result).toEqual([mockGames[0]])
    })

    it("プレイステータスでフィルタできる", async () => {
      mockPrisma.game.findMany.mockResolvedValue([mockGames[0]])

      await mockHandlers["list-games"]({}, "", "unplayed" as FilterOption, "title" as SortOption)

      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          AND: [{}, { playStatus: "unplayed" }]
        },
        orderBy: { title: "asc" }
      })
    })

    it("最近プレイした順でソートできる", async () => {
      mockPrisma.game.findMany.mockResolvedValue(mockGames)

      await mockHandlers["list-games"](
        {},
        "",
        "all" as FilterOption,
        "recentlyPlayed" as SortOption
      )

      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          AND: [{}, {}]
        },
        orderBy: { lastPlayed: "desc" }
      })
    })

    it("データベースエラー時は空配列を返す", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
      mockPrisma.game.findMany.mockRejectedValue(new Error("DB Error"))

      const result = await mockHandlers["list-games"](
        {},
        "",
        "all" as FilterOption,
        "title" as SortOption
      )

      expect(result).toEqual([])
      consoleSpy.mockRestore()
    })
  })
})
