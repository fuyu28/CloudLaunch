/**
 * @fileoverview importSchemas.tsのテスト
 *
 * Zodバリデーションスキーマの動作をテストします。
 * - 各レコードタイプのバリデーション
 * - 成功・失敗パターンの確認
 * - エラーメッセージの検証
 */

/// <reference types="jest" />

import {
  GameRecordSchema,
  PlaySessionRecordSchema,
  UploadRecordSchema,
  ChapterRecordSchema,
  MemoRecordSchema,
  validateRecord,
  validateJsonImportData,
  validateCsvRecords,
  getSchemaForRecordType
} from "../importSchemas"

describe("importSchemas", () => {
  describe("GameRecordSchema", () => {
    it("有効なゲームレコードをバリデーションできる", () => {
      const validGame = {
        id: "game-1",
        title: "Test Game",
        publisher: "Test Publisher",
        exePath: "/path/to/game.exe",
        playStatus: "unplayed",
        totalPlayTime: 0
      }

      const result = validateRecord(validGame, GameRecordSchema, "game")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.data).toBeDefined()
    })

    it("必須フィールドが不足している場合にエラーを返す", () => {
      const invalidGame = {
        id: "game-1",
        // title が不足
        exePath: "/path/to/game.exe"
      }

      const result = validateRecord(invalidGame, GameRecordSchema, "game")
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].path).toBe("game.title")
      expect(result.errors[0].message).toBe("タイトルは必須です")
    })

    it("無効なプレイステータスでエラーを返す", () => {
      const invalidGame = {
        id: "game-1",
        title: "Test Game",
        exePath: "/path/to/game.exe",
        playStatus: "invalid-status"
      }

      const result = validateRecord(invalidGame, GameRecordSchema, "game")
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("負のプレイ時間でエラーを返す", () => {
      const invalidGame = {
        id: "game-1",
        title: "Test Game",
        exePath: "/path/to/game.exe",
        totalPlayTime: -100
      }

      const result = validateRecord(invalidGame, GameRecordSchema, "game")
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.message.includes("プレイ時間は0以上"))).toBe(true)
    })
  })

  describe("PlaySessionRecordSchema", () => {
    it("有効なプレイセッションレコードをバリデーションできる", () => {
      const validSession = {
        id: "session-1",
        gameId: "game-1",
        duration: 3600,
        playedAt: "2024-01-01T12:00:00.000Z"
      }

      const result = validateRecord(validSession, PlaySessionRecordSchema, "playSession")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("負のプレイ時間でエラーを返す", () => {
      const invalidSession = {
        id: "session-1",
        gameId: "game-1",
        duration: -100
      }

      const result = validateRecord(invalidSession, PlaySessionRecordSchema, "playSession")
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.message.includes("プレイ時間は0以上"))).toBe(true)
    })
  })

  describe("UploadRecordSchema", () => {
    it("有効なアップロードレコードをバリデーションできる", () => {
      const validUpload = {
        id: "upload-1",
        gameId: "game-1",
        comment: "Test upload",
        createdAt: "2024-01-01T12:00:00.000Z"
      }

      const result = validateRecord(validUpload, UploadRecordSchema, "upload")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe("ChapterRecordSchema", () => {
    it("有効なチャプターレコードをバリデーションできる", () => {
      const validChapter = {
        id: "chapter-1",
        gameId: "game-1",
        name: "Chapter 1",
        order: 1
      }

      const result = validateRecord(validChapter, ChapterRecordSchema, "chapter")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("負の順序でエラーを返す", () => {
      const invalidChapter = {
        id: "chapter-1",
        gameId: "game-1",
        name: "Chapter 1",
        order: -1
      }

      const result = validateRecord(invalidChapter, ChapterRecordSchema, "chapter")
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.message.includes("順序は0以上"))).toBe(true)
    })
  })

  describe("MemoRecordSchema", () => {
    it("有効なメモレコードをバリデーションできる", () => {
      const validMemo = {
        id: "memo-1",
        gameId: "game-1",
        title: "Test Memo",
        content: "This is a test memo"
      }

      const result = validateRecord(validMemo, MemoRecordSchema, "memo")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe("JsonImportSchema", () => {
    it("有効なJSONインポートデータをバリデーションできる", () => {
      const validJsonData = {
        version: "1.0",
        exportedAt: "2024-01-01T12:00:00.000Z",
        data: {
          games: [
            {
              id: "game-1",
              title: "Test Game",
              exePath: "/path/to/game.exe"
            }
          ],
          playSessions: [
            {
              id: "session-1",
              gameId: "game-1",
              duration: 3600
            }
          ]
        }
      }

      const result = validateJsonImportData(validJsonData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("無効な構造でエラーを返す", () => {
      const invalidJsonData = {
        // data フィールドが不足
        version: "1.0"
      }

      const result = validateJsonImportData(invalidJsonData)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe("validateCsvRecords", () => {
    it("有効なCSVレコード配列をバリデーションできる", () => {
      const csvRecords = [
        {
          id: "game-1",
          title: "Test Game 1",
          exePath: "/path/to/game1.exe"
        },
        {
          id: "game-2",
          title: "Test Game 2",
          exePath: "/path/to/game2.exe"
        }
      ]

      const result = validateCsvRecords(csvRecords, GameRecordSchema, "games")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(Array.isArray(result.data)).toBe(true)
      expect((result.data as unknown[]).length).toBe(2)
    })

    it("一部無効なレコードがある場合にエラーを収集する", () => {
      const csvRecords = [
        {
          id: "game-1",
          title: "Test Game 1",
          exePath: "/path/to/game1.exe"
        },
        {
          id: "game-2",
          // title が不足
          exePath: "/path/to/game2.exe"
        }
      ]

      const result = validateCsvRecords(csvRecords, GameRecordSchema, "games")
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].path).toBe("games[1].title")
    })
  })

  describe("getSchemaForRecordType", () => {
    it("有効なレコードタイプに対してスキーマを返す", () => {
      expect(getSchemaForRecordType("games")).toBe(GameRecordSchema)
      expect(getSchemaForRecordType("playsessions")).toBe(PlaySessionRecordSchema)
      expect(getSchemaForRecordType("uploads")).toBe(UploadRecordSchema)
      expect(getSchemaForRecordType("chapters")).toBe(ChapterRecordSchema)
      expect(getSchemaForRecordType("memos")).toBe(MemoRecordSchema)
    })

    it("無効なレコードタイプに対してnullを返す", () => {
      expect(getSchemaForRecordType("invalid")).toBeNull()
      expect(getSchemaForRecordType("")).toBeNull()
    })

    it("大文字小文字を区別しない", () => {
      expect(getSchemaForRecordType("GAMES")).toBe(GameRecordSchema)
      expect(getSchemaForRecordType("Games")).toBe(GameRecordSchema)
    })
  })

  describe("エラーハンドリング", () => {
    it("不明なエラーを適切に処理する", () => {
      // 無効なスキーマでテスト（型エラーを回避するため any を使用）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidSchema = null as any

      const result = validateRecord({ test: "data" }, invalidSchema, "test")
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe("unknown_error")
    })
  })
})
