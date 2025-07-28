/**
 * @fileoverview GameModal.tsxのテスト
 *
 * このファイルは、GameModalコンポーネントの動作をテストします。
 * - レンダリングとプロップス処理
 * - フォーム入力の動作
 * - ファイル選択機能
 * - バリデーション
 * - 送信処理
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-hot-toast"

import type { InputGameData } from "../../../../types/game"
import type { ApiResult } from "../../../../types/result"
import GameModal from "../GameModal"

// React Hot Toastのモック
jest.mock("react-hot-toast", () => {
  const mockToast = {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
  return {
    __esModule: true,
    toast: mockToast,
    default: mockToast
  }
})

describe("GameModal", () => {
  const mockOnClose = jest.fn()
  const mockOnSubmit = jest.fn()
  const user = userEvent.setup()

  const defaultProps = {
    mode: "add" as const,
    initialData: undefined,
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  }

  const mockInitialData: InputGameData = {
    title: "テストゲーム",
    publisher: "テスト出版社",
    exePath: "/path/to/game.exe",
    saveFolderPath: "/path/to/saves",
    imagePath: "/path/to/image.jpg",
    playStatus: "unplayed"
  }

  // Window APIのモック
  beforeEach(() => {
    jest.clearAllMocks()

    // Window APIをモック
    Object.assign(global.window, {
      api: {
        file: {
          selectFile: jest.fn(),
          selectFolder: jest.fn(),
          validatePath: jest.fn()
        }
      }
    })
  })

  describe("レンダリング", () => {
    it("追加モードでモーダルが正常に表示される", () => {
      render(<GameModal {...defaultProps} />)

      expect(screen.getByText("ゲームの登録")).toBeInTheDocument()
      expect(screen.getByLabelText("タイトル")).toBeInTheDocument()
      expect(screen.getByLabelText("ブランド")).toBeInTheDocument()
      expect(screen.getByLabelText("サムネイル画像の場所")).toBeInTheDocument()
      expect(screen.getByLabelText("実行ファイルの場所")).toBeInTheDocument()
      expect(screen.getByLabelText("セーブデータフォルダの場所")).toBeInTheDocument()
    })

    it("編集モードでモーダルが正常に表示される", () => {
      render(<GameModal {...defaultProps} mode="edit" initialData={mockInitialData} />)

      expect(screen.getByText("ゲーム情報を編集")).toBeInTheDocument()
      expect(screen.getByDisplayValue("テストゲーム")).toBeInTheDocument()
      expect(screen.getByDisplayValue("テスト出版社")).toBeInTheDocument()
      expect(screen.getByDisplayValue("/path/to/game.exe")).toBeInTheDocument()
      expect(screen.getByDisplayValue("/path/to/saves")).toBeInTheDocument()
      expect(screen.getByDisplayValue("/path/to/image.jpg")).toBeInTheDocument()
    })

    it("閉じるボタンがクリックされたらonCloseが呼ばれる", async () => {
      render(<GameModal {...defaultProps} />)

      const closeButton = screen.getByRole("button", { name: "モーダルを閉じる" })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it("キャンセルボタンがクリックされたらonCloseが呼ばれる", async () => {
      render(<GameModal {...defaultProps} />)

      const cancelButton = screen.getByRole("button", { name: "キャンセル" })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("フォーム入力", () => {
    it("タイトルフィールドが正常に入力される", async () => {
      render(<GameModal {...defaultProps} />)

      const titleInput = screen.getByLabelText("タイトル")
      await user.type(titleInput, "マイゲーム")

      expect(titleInput).toHaveValue("マイゲーム")
    })

    it("ブランドフィールドが正常に入力される", async () => {
      render(<GameModal {...defaultProps} />)

      const publisherInput = screen.getByLabelText("ブランド")
      await user.type(publisherInput, "マイ出版社")

      expect(publisherInput).toHaveValue("マイ出版社")
    })

    it("実行ファイルパスフィールドが正常に入力される", async () => {
      render(<GameModal {...defaultProps} />)

      const exePathInput = screen.getByLabelText("実行ファイルの場所")
      await user.type(exePathInput, "/path/to/exe")

      expect(exePathInput).toHaveValue("/path/to/exe")
    })
  })

  describe("ファイル選択", () => {
    it("画像ファイル選択が正常に動作する", async () => {
      const mockSelectFile = jest.fn().mockResolvedValue({
        success: true,
        data: "/selected/image.jpg"
      })
      Object.assign(global.window, {
        api: {
          file: {
            selectFile: mockSelectFile,
            selectFolder: jest.fn(),
            validatePath: jest.fn()
          }
        }
      })

      render(<GameModal {...defaultProps} />)

      const browseButton = screen.getAllByText("参照")[0]
      await user.click(browseButton)

      await waitFor(() => {
        expect(mockSelectFile).toHaveBeenCalledWith([
          { name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }
        ])
      })
    })

    it("実行ファイル選択が正常に動作する", async () => {
      const mockSelectFile = jest.fn().mockResolvedValue({
        success: true,
        data: "/selected/game.exe"
      })
      Object.assign(global.window, {
        api: {
          file: {
            selectFile: mockSelectFile,
            selectFolder: jest.fn(),
            validatePath: jest.fn()
          }
        }
      })

      render(<GameModal {...defaultProps} />)

      const browseButton = screen.getAllByText("参照")[1]
      await user.click(browseButton)

      await waitFor(() => {
        expect(mockSelectFile).toHaveBeenCalledWith([
          { name: "Executable", extensions: ["exe", "app"] }
        ])
      })
    })

    it("セーブフォルダ選択が正常に動作する", async () => {
      const mockSelectFolder = jest.fn().mockResolvedValue({
        success: true,
        data: "/selected/saves"
      })
      Object.assign(global.window, {
        api: {
          file: {
            selectFile: jest.fn(),
            selectFolder: mockSelectFolder,
            validatePath: jest.fn()
          }
        }
      })

      render(<GameModal {...defaultProps} />)

      const browseButton = screen.getAllByText("参照")[2]
      await user.click(browseButton)

      await waitFor(() => {
        expect(mockSelectFolder).toHaveBeenCalled()
      })
    })
  })

  describe("バリデーション", () => {
    it("必須フィールドが空の場合、送信ボタンが無効化される", () => {
      render(<GameModal {...defaultProps} />)

      const submitButton = screen.getByRole("button", { name: "追加" })
      expect(submitButton).toBeDisabled()
    })

    it("必須フィールドが入力されている場合、送信ボタンが有効化される", async () => {
      render(<GameModal {...defaultProps} />)

      const titleInput = screen.getByLabelText("タイトル")
      const publisherInput = screen.getByLabelText("ブランド")
      const exePathInput = screen.getByLabelText("実行ファイルの場所")

      await user.type(titleInput, "テストゲーム")
      await user.type(publisherInput, "テスト出版社")
      await user.type(exePathInput, "/path/to/game.exe")

      const submitButton = screen.getByRole("button", { name: "追加" })
      expect(submitButton).toBeEnabled()
    })
  })

  describe("フォーム送信", () => {
    it("フォーム送信が正常に実行される", async () => {
      const mockResult: ApiResult = { success: true }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<GameModal {...defaultProps} />)

      const titleInput = screen.getByLabelText("タイトル")
      const publisherInput = screen.getByLabelText("ブランド")
      const exePathInput = screen.getByLabelText("実行ファイルの場所")

      await user.type(titleInput, "テストゲーム")
      await user.type(publisherInput, "テスト出版社")
      await user.type(exePathInput, "/path/to/game.exe")

      const submitButton = screen.getByRole("button", { name: "追加" })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: "テストゲーム",
          publisher: "テスト出版社",
          exePath: "/path/to/game.exe",
          saveFolderPath: "",
          imagePath: "",
          playStatus: "unplayed"
        })
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("フォーム送信でエラーが発生した場合、エラーメッセージが表示される", async () => {
      const mockResult: ApiResult = { success: false, message: "エラーが発生しました" }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<GameModal {...defaultProps} />)

      const titleInput = screen.getByLabelText("タイトル")
      const publisherInput = screen.getByLabelText("ブランド")
      const exePathInput = screen.getByLabelText("実行ファイルの場所")

      await user.type(titleInput, "テストゲーム")
      await user.type(publisherInput, "テスト出版社")
      await user.type(exePathInput, "/path/to/game.exe")

      const submitButton = screen.getByRole("button", { name: "追加" })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("エラーが発生しました")
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it("編集モードでフォーム送信が正常に実行される", async () => {
      const mockResult: ApiResult = { success: true }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<GameModal {...defaultProps} mode="edit" initialData={mockInitialData} />)

      const submitButton = screen.getByRole("button", { name: "更新" })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(mockInitialData)
      })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("モーダルの状態", () => {
    it("モーダルが閉じている場合、チェックボックスが未選択状態になる", () => {
      render(<GameModal {...defaultProps} isOpen={false} />)

      const modalToggle = screen.getByRole("checkbox")
      expect(modalToggle).not.toBeChecked()
    })

    it("モーダルが開いている場合、チェックボックスが選択状態になる", () => {
      render(<GameModal {...defaultProps} isOpen={true} />)

      const modalToggle = screen.getByRole("checkbox")
      expect(modalToggle).toBeChecked()
    })
  })
})
