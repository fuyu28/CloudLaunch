/**
 * @fileoverview useGameActions.tsのテスト
 *
 * このファイルは、ゲーム操作フックをテストします。
 * - ゲーム作成機能
 * - ゲーム更新機能
 * - エラーハンドリング
 * - ローディング状態管理
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { renderHook, act } from "@testing-library/react"
import { useGameActions } from "../useGameActions"
import { useLoadingState } from "../useLoadingState"
import type { InputGameData, Game } from "../../../../types/game"
import type { ApiResult } from "../../../../types/result"
import type { FilterOption, SortOption } from "../../../../types/menu"

// useLoadingState のモック
jest.mock("../useLoadingState", () => ({
  useLoadingState: () => ({
    isLoading: false,
    error: null,
    setLoading: jest.fn(),
    setError: jest.fn(),
    reset: jest.fn(),
    executeWithLoading: jest.fn()
  })
}))

// Window API のモック
const mockGameApi = {
  createGame: jest.fn(),
  updateGame: jest.fn(),
  listGames: jest.fn()
}

Object.defineProperty(window, "api", {
  value: {
    database: mockGameApi
  },
  writable: true
})

describe("useGameActions", () => {
  const mockProps = {
    searchWord: "",
    filter: "all" as FilterOption,
    sort: "title" as SortOption,
    onGamesUpdate: jest.fn(),
    onModalClose: jest.fn()
  }

  const mockGameData: InputGameData = {
    title: "Test Game",
    publisher: "Test Publisher",
    exePath: "/path/to/game.exe",
    saveFolderPath: "/path/to/saves",
    imagePath: "/path/to/image.jpg",
    playStatus: "unplayed"
  }

  const mockGames: Game[] = [
    {
      id: "game-1",
      title: "Test Game",
      publisher: "Test Publisher",
      exePath: "/path/to/game.exe",
      saveFolderPath: "/path/to/saves",
      imagePath: "/path/to/image.jpg",
      totalPlayTime: 0,
      lastPlayed: null,
      playStatus: "unplayed",
      createdAt: new Date("2024-01-01"),
      currentChapter: null
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createGameAndRefreshList", () => {
    it("ゲーム作成が成功した場合、ゲーム一覧を更新してモーダルを閉じる", async () => {
      const mockCreateResult: ApiResult<Game> = {
        success: true,
        data: mockGames[0]
      }

      mockGameApi.createGame.mockResolvedValue(mockCreateResult)
      mockGameApi.listGames.mockResolvedValue(mockGames)

      // executeWithLoading のモックを設定
      const mockExecuteWithLoading = jest.fn().mockImplementation(async (asyncFn) => {
        const result = await asyncFn()
        if (result.success) {
          return { success: true, data: undefined } // Return data as undefined for ApiResult<void>
        } else {
          return { success: false, message: result.message }
        }
      })

      jest.mocked(useLoadingState).mockReturnValue({
        isLoading: false,
        error: null,
        setLoading: jest.fn(),
        setError: jest.fn(),
        reset: jest.fn(),
        executeWithLoading: mockExecuteWithLoading
      })

      const { result } = renderHook(() => useGameActions(mockProps))

      let actionResult: ApiResult<void> = { success: false, message: "Not executed" } // Initialize actionResult
      await act(async () => {
        actionResult = await result.current.createGameAndRefreshList(mockGameData)
      })

      expect(mockExecuteWithLoading).toHaveBeenCalled()
      expect(mockGameApi.createGame).toHaveBeenCalledWith(mockGameData)
      expect(mockGameApi.listGames).toHaveBeenCalledWith("", "all", "title")
      expect(mockProps.onGamesUpdate).toHaveBeenCalledWith(mockGames)
      expect(mockProps.onModalClose).toHaveBeenCalled()
      expect(actionResult.success).toBe(true)
    })

    it("ゲーム作成が失敗した場合、エラーを返す", async () => {
      const mockCreateResult: ApiResult = {
        success: false,
        message: "ゲーム作成に失敗しました"
      }

      mockGameApi.createGame.mockResolvedValue(mockCreateResult)

      const mockExecuteWithLoading = jest.fn().mockImplementation(async (asyncFn) => {
        await asyncFn()
        return mockCreateResult // エラー時にmockCreateResultを返す
      })

      jest.mocked(useLoadingState).mockReturnValue({
        isLoading: false,
        error: null,
        setLoading: jest.fn(),
        setError: jest.fn(),
        reset: jest.fn(),
        executeWithLoading: mockExecuteWithLoading
      })

      const { result } = renderHook(() => useGameActions(mockProps))

      let actionResult: ApiResult<void> = { success: false, message: "Not executed" } // Initialize actionResult
      await act(async () => {
        actionResult = await result.current.createGameAndRefreshList(mockGameData)
      })

      expect(mockGameApi.createGame).toHaveBeenCalledWith(mockGameData)
      expect(mockGameApi.listGames).not.toHaveBeenCalled()
      expect(mockProps.onGamesUpdate).not.toHaveBeenCalled()
      expect(mockProps.onModalClose).not.toHaveBeenCalled()
      expect(actionResult.success).toBe(false)
      if (!actionResult.success) {
        expect(actionResult.message).toBe("ゲーム作成に失敗しました")
      }
    })

    it("例外が発生した場合、エラーを返す", async () => {
      const error = new Error("Network error")
      mockGameApi.createGame.mockRejectedValue(error)

      const mockExecuteWithLoading = jest.fn().mockImplementation(async (asyncFn) => {
        try {
          const result = await asyncFn()
          return { success: true, data: result } // 成功時もApiResultを返す
        } catch (e) {
          return { success: false, message: (e as Error).message } // 例外発生時にエラーメッセージを返す
        }
      })

      jest.mocked(useLoadingState).mockReturnValue({
        isLoading: false,
        error: null,
        setLoading: jest.fn(),
        setError: jest.fn(),
        reset: jest.fn(),
        executeWithLoading: mockExecuteWithLoading
      })

      const { result } = renderHook(() => useGameActions(mockProps))

      let actionResult: ApiResult<void> = { success: false, message: "Not executed" } // Initialize actionResult
      await act(async () => {
        actionResult = await result.current.createGameAndRefreshList(mockGameData)
      })

      expect(actionResult.success).toBe(false)
      if (!actionResult.success) {
        expect(actionResult.message).toBe("Network error")
      }
    })

    it("検索条件とフィルタが正しく渡される", async () => {
      const propsWithFilters = {
        ...mockProps,
        searchWord: "test search",
        filter: "playing" as FilterOption,
        sort: "lastPlayed" as SortOption
      }

      const mockCreateResult: ApiResult<Game> = {
        success: true,
        data: mockGames[0]
      }

      mockGameApi.createGame.mockResolvedValue(mockCreateResult)
      mockGameApi.listGames.mockResolvedValue(mockGames)

      const mockExecuteWithLoading = jest.fn().mockImplementation(async (asyncFn) => {
        return await asyncFn()
      })

      jest.mocked(useLoadingState).mockReturnValue({
        isLoading: false,
        error: null,
        setLoading: jest.fn(),
        setError: jest.fn(),
        reset: jest.fn(),
        executeWithLoading: mockExecuteWithLoading
      })

      const { result } = renderHook(() => useGameActions(propsWithFilters))

      await act(async () => {
        await result.current.createGameAndRefreshList(mockGameData)
      })

      expect(mockGameApi.listGames).toHaveBeenCalledWith("test search", "playing", "lastPlayed")
    })
  })

  // updateGameAndRefreshList 機能は現在実装されていないためテストをコメントアウト
  // 将来的に実装される場合に備えてテストは残しておく
  /*
  describe('updateGameAndRefreshList', () => {
    const gameId = 'game-1'

    it('ゲーム更新が成功した場合、ゲーム一覧を更新してモーダルを閉じる', async () => {
      // 実装待ち
    })

    it('ゲーム更新が失敗した場合、エラーを返す', async () => {
      // 実装待ち
    })
  })
  */

  describe("依存配列の安定性", () => {
    it("プロパティが変更されたときに関数が再作成される", () => {
      const { result, rerender } = renderHook((props) => useGameActions(props), {
        initialProps: mockProps
      })

      const firstCreateFn = result.current.createGameAndRefreshList

      const newProps = {
        ...mockProps,
        searchWord: "new search"
      }

      rerender(newProps)

      expect(result.current.createGameAndRefreshList).not.toBe(firstCreateFn)
    })

    it("プロパティが変更されなければ関数の参照が保持される", () => {
      const { result, rerender } = renderHook(() => useGameActions(mockProps))

      const firstCreateFn = result.current.createGameAndRefreshList

      rerender()

      expect(result.current.createGameAndRefreshList).toBe(firstCreateFn)
    })
  })

  describe("ローディング状態との統合", () => {
    it("executeWithLoading に正しいオプションが渡される", async () => {
      const mockCreateResult: ApiResult<Game> = {
        success: true,
        data: mockGames[0]
      }

      mockGameApi.createGame.mockResolvedValue(mockCreateResult)
      mockGameApi.listGames.mockResolvedValue(mockGames)

      const mockExecuteWithLoading = jest.fn().mockImplementation(async (asyncFn, options) => {
        expect(options.loadingMessage).toBe("ゲームを追加しています...")
        expect(options.successMessage).toBe("ゲームを追加しました")
        expect(options.showToast).toBe(true)
        return await asyncFn()
      })

      jest.mocked(useLoadingState).mockReturnValue({
        isLoading: false,
        error: null,
        setLoading: jest.fn(),
        setError: jest.fn(),
        reset: jest.fn(),
        executeWithLoading: mockExecuteWithLoading
      })

      const { result } = renderHook(() => useGameActions(mockProps))

      await act(async () => {
        await result.current.createGameAndRefreshList(mockGameData)
      })

      expect(mockExecuteWithLoading).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          loadingMessage: "ゲームを追加しています...",
          successMessage: "ゲームを追加しました",
          showToast: true
        })
      )
    })
  })
})
