/**
 * @fileoverview stringUtils.tsのテスト
 *
 * このファイルは、文字列操作ユーティリティ関数をテストします。
 * - ファイル名サニタイズ
 * - ゲームタイトルサニタイズ
 * - パス作成
 * - 文字列フォーマット
 */

/// <reference types="jest" />

import {
  sanitizeFilename,
  sanitizeGameTitle,
  createRemotePath,
  isNonEmptyString,
  normalizeWhitespace,
  camelToKebab,
  truncateString
} from "../stringUtils"

describe("stringUtils", () => {
  describe("sanitizeFilename", () => {
    it("無効な文字を_に置き換える", () => {
      const input = "game<name>with:invalid/chars\\and|more?*"
      const expected = "game_name_with_invalid_chars_and_more__"

      expect(sanitizeFilename(input)).toBe(expected)
    })

    it("有効なファイル名はそのまま返す", () => {
      const input = "valid_filename-123.txt"

      expect(sanitizeFilename(input)).toBe(input)
    })

    it("空文字列の場合は空文字列を返す", () => {
      expect(sanitizeFilename("")).toBe("")
    })

    it("日本語文字は保持される", () => {
      const input = "ゲーム名前.txt"

      expect(sanitizeFilename(input)).toBe(input)
    })
  })

  describe("sanitizeGameTitle", () => {
    it("ゲームタイトルの無効文字をサニタイズする", () => {
      const input = "Final Fantasy XIV: Endwalker"
      const expected = "Final Fantasy XIV_ Endwalker"

      expect(sanitizeGameTitle(input)).toBe(expected)
    })

    it("空白文字も適切に処理される", () => {
      const input = "Game  With   Multiple    Spaces"
      const expected = "Game  With   Multiple    Spaces"

      expect(sanitizeGameTitle(input)).toBe(expected)
    })
  })

  describe("createRemotePath", () => {
    it("ゲームタイトルからリモートパスを作成する", () => {
      const gameTitle = "Cyberpunk 2077"
      const expected = "games/Cyberpunk 2077/save_data"

      expect(createRemotePath(gameTitle)).toBe(expected)
    })

    it("無効文字を含むタイトルでも正しいパスを作成する", () => {
      const gameTitle = "Game: Special Edition"
      const expected = "games/Game_ Special Edition/save_data"

      expect(createRemotePath(gameTitle)).toBe(expected)
    })

    it("空のタイトルでも処理される", () => {
      const expected = "games//save_data"

      expect(createRemotePath("")).toBe(expected)
    })
  })

  describe("isNonEmptyString", () => {
    it("有効な文字列の場合はtrueを返す", () => {
      expect(isNonEmptyString("hello")).toBe(true)
      expect(isNonEmptyString("world")).toBe(true)
      expect(isNonEmptyString("test string")).toBe(true)
    })

    it("空文字列の場合はfalseを返す", () => {
      expect(isNonEmptyString("")).toBe(false)
    })

    it("空白のみの場合はfalseを返す", () => {
      expect(isNonEmptyString("   ")).toBe(false)
      expect(isNonEmptyString("\t\n")).toBe(false)
    })

    it("null/undefinedの場合はfalseを返す", () => {
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
    })
  })

  describe("normalizeWhitespace", () => {
    it("前後の空白を削除する", () => {
      expect(normalizeWhitespace("  hello world  ")).toBe("hello world")
    })

    it("連続する空白を単一のスペースに変換する", () => {
      expect(normalizeWhitespace("hello    world")).toBe("hello world")
      expect(normalizeWhitespace("a  b   c    d")).toBe("a b c d")
    })

    it("タブや改行も正規化する", () => {
      expect(normalizeWhitespace("hello\t\tworld")).toBe("hello world")
      expect(normalizeWhitespace("hello\n\nworld")).toBe("hello world")
    })

    it("正常な文字列はそのまま返す", () => {
      expect(normalizeWhitespace("hello world")).toBe("hello world")
    })
  })

  describe("camelToKebab", () => {
    it("キャメルケースをケバブケースに変換する", () => {
      expect(camelToKebab("camelCase")).toBe("camel-case")
      expect(camelToKebab("PascalCase")).toBe("pascal-case")
      expect(camelToKebab("someVariableName")).toBe("some-variable-name")
    })

    it("既にケバブケースの場合はそのまま", () => {
      expect(camelToKebab("kebab-case")).toBe("kebab-case")
    })

    it("単語1つの場合はそのまま", () => {
      expect(camelToKebab("word")).toBe("word")
      expect(camelToKebab("Word")).toBe("word")
    })

    it("数字を含む場合も正しく処理する", () => {
      expect(camelToKebab("test123Value")).toBe("test123-value")
      expect(camelToKebab("html5Parser")).toBe("html5-parser")
    })

    it("連続する大文字を正しく処理する", () => {
      expect(camelToKebab("XMLHttpRequest")).toBe("xml-http-request")
      expect(camelToKebab("HTMLElement")).toBe("html-element")
    })
  })

  describe("truncateString", () => {
    it("文字列が制限より長い場合は切り詰める", () => {
      const input = "This is a very long string that should be truncated"
      const result = truncateString(input, 20)

      expect(result).toBe("This is a very lo...")
      expect(result.length).toBe(20)
    })

    it("文字列が制限以下の場合はそのまま返す", () => {
      const input = "Short string"
      const result = truncateString(input, 20)

      expect(result).toBe(input)
    })

    it("制限が文字列長と同じ場合はそのまま返す", () => {
      const input = "Exact length"
      const result = truncateString(input, input.length)

      expect(result).toBe(input)
    })

    it("カスタム省略記号を指定できる", () => {
      const input = "This is a long string"
      const result = truncateString(input, 15, "…")

      expect(result).toBe("This is a long…")
      expect(result.length).toBe(15)
    })

    it("制限がellipsisの長さ以下の場合はellipsisのみ返す", () => {
      const input = "Test"
      const result = truncateString(input, 2)

      // maxLength(2) <= ellipsis.length(3) なので省略記号のみ返す
      expect(result).toBe("...")
    })

    it("空文字列を適切に処理する", () => {
      expect(truncateString("", 10)).toBe("")
    })
  })
})
