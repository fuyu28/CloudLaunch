/**
 * @fileoverview validationUtils.tsのテスト
 *
 * このファイルは、バリデーションユーティリティ関数をテストします。
 * - 必須フィールドバリデーション
 * - 文字列長バリデーション
 * - URLバリデーション
 * - 複合バリデーション
 */

/// <reference types="jest" />

import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUrl,
  validateR2OrS3Endpoint,
  combineValidationResults,
  hasValidationErrors,
  getFirstErrorMessage,
  ValidationErrors
} from "../validationUtils"

describe("validationUtils", () => {
  describe("validateRequired", () => {
    it("値が存在する場合は有効", () => {
      const result = validateRequired("test value", "フィールド名")

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("空文字列の場合は無効", () => {
      const result = validateRequired("", "タイトル")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("タイトルは必須項目です")
    })

    it("空白文字のみの場合は無効", () => {
      const result = validateRequired("   ", "フィールド")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("フィールドは必須項目です")
    })

    it("undefined/undefinedの場合は無効", () => {
      const resultundefined = validateRequired(undefined, "フィールド")
      const resultUndefined = validateRequired(undefined, "フィールド")

      expect(resultundefined.isValid).toBe(false)
      expect(resultUndefined.isValid).toBe(false)
    })
  })

  describe("validateMinLength", () => {
    it("最小長以上の場合は有効", () => {
      const result = validateMinLength("password123", 8, "パスワード")

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("最小長未満の場合は無効", () => {
      const result = validateMinLength("short", 8, "パスワード")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("パスワードは8文字以上で入力してください")
    })

    it("ちょうど最小長の場合は有効", () => {
      const result = validateMinLength("12345678", 8, "パスワード")

      expect(result.isValid).toBe(true)
    })
  })

  describe("validateMaxLength", () => {
    it("最大長以下の場合は有効", () => {
      const result = validateMaxLength("short text", 50, "コメント")

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("最大長超過の場合は無効", () => {
      const longText = "a".repeat(101)
      const result = validateMaxLength(longText, 100, "コメント")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("コメントは100文字以内で入力してください")
    })

    it("ちょうど最大長の場合は有効", () => {
      const exactText = "a".repeat(100)
      const result = validateMaxLength(exactText, 100, "コメント")

      expect(result.isValid).toBe(true)
    })
  })

  describe("validateUrl", () => {
    it("有効なHTTPS URLの場合は有効", () => {
      const result = validateUrl("https://example.com", "エンドポイント")

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("有効なHTTP URLの場合は有効", () => {
      const result = validateUrl("http://localhost:3000", "エンドポイント")

      expect(result.isValid).toBe(true)
    })

    it("無効なURLの場合は無効", () => {
      const result = validateUrl("not-a-url", "エンドポイント")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("エンドポイントは有効なURLを入力してください")
    })

    it("空文字列の場合は無効", () => {
      const result = validateUrl("", "エンドポイント")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("エンドポイントは有効なURLを入力してください")
    })

    it("プロトコルなしの場合は無効", () => {
      const result = validateUrl("example.com", "エンドポイント")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("エンドポイントは有効なURLを入力してください")
    })
  })

  describe("validateR2OrS3Endpoint", () => {
    it("有効なR2エンドポイントの場合は有効", () => {
      const result = validateR2OrS3Endpoint("https://example.r2.cloudflarestorage.com")

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("有効なS3エンドポイントの場合は有効", () => {
      const result1 = validateR2OrS3Endpoint("https://s3.amazonaws.com")
      const result2 = validateR2OrS3Endpoint("https://bucket.s3.us-west-2.amazonaws.com")

      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(true)
    })

    it("カスタムエンドポイントの場合は有効", () => {
      const result = validateR2OrS3Endpoint("https://custom.endpoint.com")

      expect(result.isValid).toBe(true)
    })

    it("HTTPSでない場合は無効", () => {
      const result = validateR2OrS3Endpoint("http://example.com")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("エンドポイントはHTTPSで始まる必要があります")
    })

    it("無効なURLの場合は無効", () => {
      const result = validateR2OrS3Endpoint("not-a-url")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("エンドポイントは有効なURLを入力してください")
    })

    it("不正なパターンの場合は無効", () => {
      const result = validateR2OrS3Endpoint("https://invalid")

      expect(result.isValid).toBe(false)
      expect(result.message).toBe("有効なR2またはS3エンドポイントを入力してください")
    })
  })

  describe("hasValidationErrors", () => {
    it("エラーがない場合はfalseを返す", () => {
      const errors: ValidationErrors = {}

      expect(hasValidationErrors(errors)).toBe(false)
    })

    it("undefinedのフィールドのみの場合はfalseを返す", () => {
      const errors: ValidationErrors = {
        field1: undefined,
        field2: undefined
      }

      expect(hasValidationErrors(errors)).toBe(false)
    })

    it("エラーがある場合はtrueを返す", () => {
      const errors: ValidationErrors = {
        field1: undefined,
        field2: "エラーメッセージ"
      }

      expect(hasValidationErrors(errors)).toBe(true)
    })
  })

  describe("getFirstErrorMessage", () => {
    it("エラーがない場合はundefinedを返す", () => {
      const errors: ValidationErrors = {}

      expect(getFirstErrorMessage(errors)).toBeUndefined()
    })

    it("最初のエラーメッセージを返す", () => {
      const errors: ValidationErrors = {
        field1: undefined,
        field2: "最初のエラー",
        field3: "2番目のエラー"
      }

      expect(getFirstErrorMessage(errors)).toBe("最初のエラー")
    })
  })

  describe("combineValidationResults", () => {
    it("すべてが有効な場合は有効", () => {
      const results = [{ isValid: true }, { isValid: true }, { isValid: true }]

      const combined = combineValidationResults(results)

      expect(combined.isValid).toBe(true)
      expect(combined.message).toBeUndefined()
    })

    it("一つでも無効がある場合は最初の無効結果を返す", () => {
      const results = [
        { isValid: true },
        { isValid: false, message: "エラー1" },
        { isValid: false, message: "エラー2" }
      ]

      const combined = combineValidationResults(results)

      expect(combined.isValid).toBe(false)
      expect(combined.message).toBe("エラー1")
    })

    it("空配列の場合は有効", () => {
      const combined = combineValidationResults([])

      expect(combined.isValid).toBe(true)
      expect(combined.message).toBeUndefined()
    })
  })
})
