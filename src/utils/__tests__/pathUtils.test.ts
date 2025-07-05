/**
 * @fileoverview pathUtils.tsのテスト
 *
 * このファイルは、パス操作ユーティリティ関数をテストします。
 * - ファイル拡張子取得
 * - ファイル名取得
 * - ディレクトリパス取得
 * - パス結合
 * - パス正規化
 */

/// <reference types="jest" />

import {
  getFileExtension,
  getFileNameWithoutExtension,
  getParentDirectory,
  joinPaths,
  sanitizeFileName,
  createS3Key,
  localPathToS3Key,
  isRelativePath,
  hasValidExtension,
  validatePath
} from "../pathUtils"

describe("pathUtils", () => {
  describe("getFileExtension", () => {
    it("拡張子を正しく取得する", () => {
      expect(getFileExtension("file.txt")).toBe(".txt")
      expect(getFileExtension("image.png")).toBe(".png")
      expect(getFileExtension("game.exe")).toBe(".exe")
    })

    it("複数のドットがある場合は最後の拡張子を取得", () => {
      expect(getFileExtension("backup.tar.gz")).toBe(".gz")
      expect(getFileExtension("file.test.js")).toBe(".js")
    })

    it("拡張子がない場合は空文字列", () => {
      expect(getFileExtension("filename")).toBe("")
      expect(getFileExtension("folder/")).toBe("")
    })

    it("隠しファイルの拡張子を正しく処理", () => {
      expect(getFileExtension(".gitignore")).toBe("")
      expect(getFileExtension(".env.local")).toBe(".local")
    })
  })

  describe("getFileNameWithoutExtension", () => {
    it("ファイル名（拡張子なし）を正しく取得する", () => {
      expect(getFileNameWithoutExtension("/path/to/file.txt")).toBe("file")
      expect(getFileNameWithoutExtension("C:\\Users\\user\\game.exe")).toBe("game")
      expect(getFileNameWithoutExtension("image.png")).toBe("image")
    })

    it("拡張子がないファイル名の場合", () => {
      expect(getFileNameWithoutExtension("filename")).toBe("filename")
    })

    it("空文字列の場合", () => {
      expect(getFileNameWithoutExtension("")).toBe("")
    })
  })

  describe("getParentDirectory", () => {
    it("親ディレクトリパスを正しく取得する", () => {
      expect(getParentDirectory("/path/to/file.txt")).toBe("/path/to")
      expect(getParentDirectory("C:\\Users\\user\\game.exe")).toBe("C:\\Users\\user")
    })

    it("ルートディレクトリの場合", () => {
      expect(getParentDirectory("/file.txt")).toBe("/")
      expect(getParentDirectory("C:\\file.txt")).toBe("C:\\")
    })

    it("ディレクトリのみの場合", () => {
      expect(getParentDirectory("/path/to/")).toBe("/path/to")
      expect(getParentDirectory("/path/to")).toBe("/path")
    })
  })

  describe("joinPaths", () => {
    it("パスを正しく結合する", () => {
      expect(joinPaths("path", "to", "file")).toBe("path/to/file")
      expect(joinPaths("/root", "folder", "file.txt")).toBe("/root/folder/file.txt")
    })

    it("末尾のスラッシュを適切に処理する", () => {
      expect(joinPaths("path/", "to/", "file")).toBe("path/to/file")
      expect(joinPaths("/root/", "/folder/", "/file.txt")).toBe("/root/folder/file.txt")
    })

    it("空の部分を適切に処理する", () => {
      expect(joinPaths("path", "", "file")).toBe("path/file")
      expect(joinPaths("", "path", "file")).toBe("path/file")
    })

    it("単一のパスの場合", () => {
      expect(joinPaths("single")).toBe("single")
      expect(joinPaths()).toBe("")
    })
  })

  describe("sanitizeFileName", () => {
    it("ファイル名をサニタイズしてパスセーフにする", () => {
      expect(sanitizeFileName("file<name>?.txt")).toBe("file_name__.txt")
      expect(sanitizeFileName("path/to:file|name*")).toBe("path_to_file_name_")
    })
  })

  describe("createS3Key", () => {
    it("S3キー用のパスを生成する", () => {
      expect(createS3Key("games", "my-game", "save-data")).toBe("games/my-game/save-data")
      expect(createS3Key("", "folder", "file.txt")).toBe("folder/file.txt")
    })
  })

  describe("localPathToS3Key", () => {
    it("ローカルパスをS3キー形式に変換する", () => {
      expect(localPathToS3Key("C:\\Users\\user\\game.exe")).toBe("C:/Users/user/game.exe")
      expect(localPathToS3Key("/home/user/game.sh")).toBe("/home/user/game.sh")
    })
  })

  describe("isRelativePath", () => {
    it("相対パスを正しく判定する", () => {
      expect(isRelativePath("path/to/file")).toBe(true)
      expect(isRelativePath("./file.txt")).toBe(true)
      expect(isRelativePath("../folder/file")).toBe(true)
    })

    it("絶対パスを正しく判定する", () => {
      expect(isRelativePath("/path/to/file")).toBe(false)
      expect(isRelativePath("C:\\Users\\user")).toBe(false)
      expect(isRelativePath("D:/folder/file.txt")).toBe(false)
    })
  })

  describe("hasValidExtension", () => {
    it("有効な拡張子を正しく判定する", () => {
      expect(hasValidExtension("image.png", ["png", "jpg"])).toBe(true)
      expect(hasValidExtension("document.PDF", ["pdf"])).toBe(true)
    })

    it("無効な拡張子を正しく判定する", () => {
      expect(hasValidExtension("image.gif", ["png", "jpg"])).toBe(false)
      expect(hasValidExtension("archive.zip", ["pdf"])).toBe(false)
    })

    it("拡張子がないファイルを正しく判定する", () => {
      expect(hasValidExtension("filename", ["txt"])).toBe(false)
    })
  })

  describe("validatePath", () => {
    it("有効なパスを正しく検証する", () => {
      const result = validatePath("/path/to/file.txt")
      expect(result.isValid).toBe(true)
      expect(result.normalizedPath).toBe("/path/to/file.txt")
    })

    it("無効なパスを正しく検証する", () => {
      const result = validatePath("")
      expect(result.isValid).toBe(false)
      expect(result.message).toBe("パスが指定されていません")
    })

    it("相対参照を含むパスを拒否する", () => {
      const result = validatePath("../file.txt")
      expect(result.isValid).toBe(false)
      expect(result.message).toBe("パスに相対参照（..）を含むことはできません")
    })

    it("Windowsパスを正しく検証する", () => {
      const result = validatePath("C:\\Users\\user\\file.txt")
      expect(result.isValid).toBe(true)
      expect(result.normalizedPath).toBe("C:\\Users\\user\\file.txt")
    })

    it("無効なWindowsパス形式を拒否する", () => {
      const result = validatePath("Users\\user\\file.txt")
      expect(result.isValid).toBe(false)
      expect(result.message).toBe("無効なWindowsパス形式です")
    })

    it("Unix系パスを正しく検証する", () => {
      const result = validatePath("/home/user/file.txt")
      expect(result.isValid).toBe(true)
      expect(result.normalizedPath).toBe("/home/user/file.txt")
    })

    it("無効なUnix系パス形式を拒否する", () => {
      const result = validatePath("home/user/file.txt")
      expect(result.isValid).toBe(false)
      expect(result.message).toBe("絶対パスを指定してください")
    })
  })
})
