/**
 * @fileoverview credentialService.tsのテスト
 *
 * このファイルは、credentialService.tsの認証情報管理機能をテストします。
 * - 認証情報の設定
 * - 認証情報の取得
 * - エラーハンドリング（keytar、electron-store）
 */

/// <reference types="jest" />

import { setCredential, getCredential } from "../credentialService"
import type { Creds } from "../../../types/creds"
import * as keytar from "keytar"
import Store from "electron-store"

// モックの設定
jest.mock("keytar")
jest.mock("electron-store")

const mockKeytar = keytar as jest.Mocked<typeof keytar>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStoreInstance: any = {
  set: jest.fn(),
  get: jest.fn(),
  store: {
    bucketName: "test-bucket",
    region: "us-east-1",
    endpoint: "https://test.endpoint.com",
    accessKeyId: "test-access-key"
  },
  delete: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  size: 0,
  openInEditor: jest.fn(),
  path: "/mock/path",
  events: {}
}

const MockedStore = Store as unknown as jest.MockedClass<typeof Store>

describe("credentialService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockedStore.mockImplementation(() => mockStoreInstance)
  })

  describe("setCredential", () => {
    const mockCreds: Creds = {
      bucketName: "test-bucket",
      region: "us-east-1",
      endpoint: "https://test.endpoint.com",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key"
    }

    it("認証情報を正常に設定できる", async () => {
      mockKeytar.setPassword.mockResolvedValue()

      const result = await setCredential(mockCreds)

      expect(mockStoreInstance.set).toHaveBeenCalledWith("bucketName", "test-bucket")
      expect(mockStoreInstance.set).toHaveBeenCalledWith("region", "us-east-1")
      expect(mockStoreInstance.set).toHaveBeenCalledWith("endpoint", "https://test.endpoint.com")
      expect(mockStoreInstance.set).toHaveBeenCalledWith("accessKeyId", "test-access-key")
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        "StorageDeck",
        "secretAccessKey",
        "test-secret-key"
      )
      expect(result).toEqual({ success: true })
    })

    it("keytarでエラーが発生した場合、エラーメッセージを返す", async () => {
      const error = new Error("Keytar error")
      mockKeytar.setPassword.mockRejectedValue(error)

      const result = await setCredential(mockCreds)

      expect(result).toEqual({
        success: false,
        message: "認証情報の設定に失敗しました: Error: Keytar error"
      })
    })

    it("electron-storeでエラーが発生した場合、エラーメッセージを返す", async () => {
      const error = new Error("Store error")
      mockStoreInstance.set.mockImplementation(() => {
        throw error
      })

      const result = await setCredential(mockCreds)

      expect(result).toEqual({
        success: false,
        message: "認証情報の設定に失敗しました: Error: Store error"
      })
    })
  })

  describe("getCredential", () => {
    beforeEach(() => {
      mockStoreInstance.get.mockImplementation((key: string) => {
        const defaults = {
          bucketName: "test-bucket",
          region: "us-east-1",
          endpoint: "https://test.endpoint.com",
          accessKeyId: "test-access-key"
        }
        return defaults[key as keyof typeof defaults]
      })
    })

    it("認証情報を正常に取得できる", async () => {
      mockKeytar.getPassword.mockResolvedValue("test-secret-key")

      const result = await getCredential()

      expect(mockKeytar.getPassword).toHaveBeenCalledWith("StorageDeck", "secretAccessKey")
      expect(result).toEqual({
        success: true,
        data: {
          bucketName: "test-bucket",
          region: "us-east-1",
          endpoint: "https://test.endpoint.com",
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key"
        }
      })
    })

    it("秘密鍵がkeytarに存在しない場合、エラーメッセージを返す", async () => {
      mockKeytar.getPassword.mockResolvedValue(null)

      const result = await getCredential()

      expect(result).toEqual({
        success: false,
        message: "認証情報が見つかりません。まず認証情報を設定してください。"
      })
    })

    it("electron-storeの認証情報が不完全な場合、エラーメッセージを返す", async () => {
      mockKeytar.getPassword.mockResolvedValue("test-secret-key")
      mockStoreInstance.get.mockImplementation((key: string) => {
        if (key === "bucketName") return ""
        return "test-value"
      })

      const result = await getCredential()

      expect(result).toEqual({
        success: false,
        message: "認証情報が不完全です。すべての設定項目を確認してください。"
      })
    })

    describe("keytarエラーハンドリング", () => {
      it("アイテムが見つからないエラーを適切に処理する", async () => {
        const error = new Error("The specified item could not be found")
        mockKeytar.getPassword.mockRejectedValue(error)

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message: "認証情報がシステムキーチェーンに見つかりません。認証情報を再設定してください。"
        })
      })

      it("アクセス拒否エラーを適切に処理する", async () => {
        const error = new Error("Access denied")
        mockKeytar.getPassword.mockRejectedValue(error)

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message:
            "システムキーチェーンへのアクセスが拒否されました。アプリケーションの権限を確認してください。"
        })
      })

      it("キーチェーンが存在しないエラーを適切に処理する", async () => {
        const error = new Error("The keychain does not exist")
        mockKeytar.getPassword.mockRejectedValue(error)

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message: "システムキーチェーンが存在しません。OSの設定を確認してください。"
        })
      })

      it("その他のエラーを適切に処理する", async () => {
        const error = new Error("Unknown error")
        mockKeytar.getPassword.mockRejectedValue(error)

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message: "認証情報の取得エラー: Unknown error"
        })
      })

      it("文字列エラーを適切に処理する", async () => {
        mockKeytar.getPassword.mockRejectedValue("String error")

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message: "認証情報の取得エラー: String error"
        })
      })

      it("不明なエラータイプを適切に処理する", async () => {
        mockKeytar.getPassword.mockRejectedValue(123)

        const result = await getCredential()

        expect(result).toEqual({
          success: false,
          message: "認証情報の取得に失敗しました。"
        })
      })
    })
  })
})
