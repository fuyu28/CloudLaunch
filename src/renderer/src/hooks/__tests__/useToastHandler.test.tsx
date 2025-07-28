/**
 * @fileoverview useToastHandler.tsのテスト
 *
 * このファイルは、トーストハンドリングフックをテストします。
 * - トースト表示機能
 * - トースト更新機能
 * - エラーハンドリング
 * - executeWithToast ヘルパー関数
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { renderHook, act } from "@testing-library/react"
import toast from "react-hot-toast"

import { useToastHandler, executeWithToast } from "../useToastHandler"

// React Hot Toastのモック
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn()
  }
}))

const mockToast = toast as jest.Mocked<typeof toast>

describe("useToastHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("showLoading", () => {
    it("メッセージありの場合、ローディングトーストを表示してIDを返す", () => {
      const mockToastId = "loading-toast-id"
      mockToast.loading.mockReturnValue(mockToastId)

      const { result } = renderHook(() => useToastHandler())

      let toastId: string | undefined
      act(() => {
        toastId = result.current.showLoading("読み込み中...")
      })

      expect(mockToast.loading).toHaveBeenCalledWith("読み込み中...")
      expect(toastId).toBe(mockToastId)
    })

    it("メッセージなしの場合、undefinedを返す", () => {
      const { result } = renderHook(() => useToastHandler())

      let toastId: string | undefined
      act(() => {
        toastId = result.current.showLoading()
      })

      expect(mockToast.loading).not.toHaveBeenCalled()
      expect(toastId).toBeUndefined()
    })

    it("空文字列の場合、undefinedを返す", () => {
      const { result } = renderHook(() => useToastHandler())

      let toastId: string | undefined
      act(() => {
        toastId = result.current.showLoading("")
      })

      expect(mockToast.loading).not.toHaveBeenCalled()
      expect(toastId).toBeUndefined()
    })
  })

  describe("showSuccess", () => {
    it("toastIdありの場合、IDを指定して成功トーストを表示する", () => {
      const { result } = renderHook(() => useToastHandler())

      act(() => {
        result.current.showSuccess("成功しました", "toast-id")
      })

      expect(mockToast.success).toHaveBeenCalledWith("成功しました", { id: "toast-id" })
    })

    it("toastIdなしの場合、新しい成功トーストを表示する", () => {
      const { result } = renderHook(() => useToastHandler())

      act(() => {
        result.current.showSuccess("成功しました")
      })

      expect(mockToast.success).toHaveBeenCalledWith("成功しました")
    })
  })

  describe("showError", () => {
    it("toastIdありの場合、IDを指定してエラートーストを表示する", () => {
      const { result } = renderHook(() => useToastHandler())

      act(() => {
        result.current.showError("エラーが発生しました", "toast-id")
      })

      expect(mockToast.error).toHaveBeenCalledWith("エラーが発生しました", { id: "toast-id" })
    })

    it("toastIdなしの場合、新しいエラートーストを表示する", () => {
      const { result } = renderHook(() => useToastHandler())

      act(() => {
        result.current.showError("エラーが発生しました")
      })

      expect(mockToast.error).toHaveBeenCalledWith("エラーが発生しました")
    })
  })

  describe("dismiss", () => {
    it("指定されたIDのトーストを削除する", () => {
      const { result } = renderHook(() => useToastHandler())

      act(() => {
        result.current.dismiss("toast-id")
      })

      expect(mockToast.dismiss).toHaveBeenCalledWith("toast-id")
    })
  })

  describe("フック関数の安定性", () => {
    it("再レンダリング時に関数が同じ参照を保持する", () => {
      const { result, rerender } = renderHook(() => useToastHandler())

      const firstRender = {
        showLoading: result.current.showLoading,
        showSuccess: result.current.showSuccess,
        showError: result.current.showError,
        dismiss: result.current.dismiss
      }

      rerender()

      const secondRender = {
        showLoading: result.current.showLoading,
        showSuccess: result.current.showSuccess,
        showError: result.current.showError,
        dismiss: result.current.dismiss
      }

      expect(firstRender.showLoading).toBe(secondRender.showLoading)
      expect(firstRender.showSuccess).toBe(secondRender.showSuccess)
      expect(firstRender.showError).toBe(secondRender.showError)
      expect(firstRender.dismiss).toBe(secondRender.dismiss)
    })
  })
})

describe("executeWithToast", () => {
  const mockToastHandler = {
    showLoading: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    dismiss: jest.fn(),
    showToast: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("成功ケース", () => {
    it("非同期関数が成功し、成功メッセージを表示する", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success result")
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        successMessage: "完了しました",
        showToast: true
      }

      const result = await executeWithToast(mockAsyncFn, options, mockToastHandler)

      expect(mockToastHandler.showLoading).toHaveBeenCalledWith("処理中...")
      expect(mockAsyncFn).toHaveBeenCalled()
      expect(mockToastHandler.showSuccess).toHaveBeenCalledWith("完了しました", toastId)
      expect(mockToastHandler.showError).not.toHaveBeenCalled()
      expect(result).toBe("success result")
    })

    it("成功メッセージがない場合、ローディングトーストを削除する", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success result")
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        showToast: true
      }

      const result = await executeWithToast(mockAsyncFn, options, mockToastHandler)

      expect(mockToastHandler.showLoading).toHaveBeenCalledWith("処理中...")
      expect(mockToastHandler.dismiss).toHaveBeenCalledWith(toastId)
      expect(mockToastHandler.showSuccess).not.toHaveBeenCalled()
      expect(result).toBe("success result")
    })

    it("showToastがfalseの場合、トーストを表示しない", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success result")

      const options = {
        loadingMessage: "処理中...",
        successMessage: "完了しました",
        showToast: false
      }

      const result = await executeWithToast(mockAsyncFn, options, mockToastHandler)

      expect(mockToastHandler.showLoading).not.toHaveBeenCalled()
      expect(mockToastHandler.showSuccess).not.toHaveBeenCalled()
      expect(mockAsyncFn).toHaveBeenCalled()
      expect(result).toBe("success result")
    })
  })

  describe("エラーケース", () => {
    it("非同期関数がエラーを投げ、エラーメッセージを表示する", async () => {
      const error = new Error("テストエラー")
      const mockAsyncFn = jest.fn().mockRejectedValue(error)
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        errorMessage: "エラーが発生しました",
        showToast: true
      }

      await expect(executeWithToast(mockAsyncFn, options, mockToastHandler)).rejects.toThrow(
        "テストエラー"
      )

      expect(mockToastHandler.showLoading).toHaveBeenCalledWith("処理中...")
      expect(mockToastHandler.showError).toHaveBeenCalledWith("エラーが発生しました", toastId)
      expect(mockToastHandler.showSuccess).not.toHaveBeenCalled()
    })

    it("カスタムエラーメッセージがない場合、元のエラーメッセージを使用する", async () => {
      const error = new Error("元のエラーメッセージ")
      const mockAsyncFn = jest.fn().mockRejectedValue(error)
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        showToast: true
      }

      await expect(executeWithToast(mockAsyncFn, options, mockToastHandler)).rejects.toThrow(
        "元のエラーメッセージ"
      )

      expect(mockToastHandler.showError).toHaveBeenCalledWith("元のエラーメッセージ", toastId)
    })

    it("Errorオブジェクトでないエラーの場合、文字列に変換する", async () => {
      const error = "string error"
      const mockAsyncFn = jest.fn().mockRejectedValue(error)
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        showToast: true
      }

      await expect(executeWithToast(mockAsyncFn, options, mockToastHandler)).rejects.toBe(
        "string error"
      )

      expect(mockToastHandler.showError).toHaveBeenCalledWith("string error", toastId)
    })

    it("showToastがfalseの場合、エラートーストを表示しない", async () => {
      const error = new Error("テストエラー")
      const mockAsyncFn = jest.fn().mockRejectedValue(error)

      const options = {
        loadingMessage: "処理中...",
        errorMessage: "エラーが発生しました",
        showToast: false
      }

      await expect(executeWithToast(mockAsyncFn, options, mockToastHandler)).rejects.toThrow(
        "テストエラー"
      )

      expect(mockToastHandler.showLoading).not.toHaveBeenCalled()
      expect(mockToastHandler.showError).not.toHaveBeenCalled()
    })
  })

  describe("オプションのデフォルト値", () => {
    it("showToastのデフォルトはtrue", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("result")
      const toastId = "loading-id"
      mockToastHandler.showLoading.mockReturnValue(toastId)

      const options = {
        loadingMessage: "処理中...",
        successMessage: "完了しました"
      }

      await executeWithToast(mockAsyncFn, options, mockToastHandler)

      expect(mockToastHandler.showLoading).toHaveBeenCalled()
      expect(mockToastHandler.showSuccess).toHaveBeenCalled()
    })
  })
})
