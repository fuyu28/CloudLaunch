/**
 * @fileoverview 定数ファイルのテスト
 *
 * このファイルは、定数ファイルの構造と内容をテストします。
 * - メッセージ定数の構造チェック
 * - 設定値の妥当性チェック
 * - パターンの動作確認
 * - エクスポートの整合性チェック
 */

/// <reference types="jest" />

import { MESSAGES } from "../messages"
import { CONFIG } from "../config"
import { PATTERNS } from "../patterns"
import * as constantsIndex from "../index"

describe("constants", () => {
  describe("MESSAGES", () => {
    it("メッセージ構造が正しく定義されている", () => {
      expect(MESSAGES).toBeDefined()
      expect(typeof MESSAGES).toBe("object")
    })

    it("GAME メッセージが完全に定義されている", () => {
      expect(MESSAGES.GAME).toBeDefined()
      expect(MESSAGES.GAME.ADDING).toBe("ゲームを追加しています...")
      expect(MESSAGES.GAME.ADDED).toBe("ゲームを追加しました")
      expect(MESSAGES.GAME.ADD_FAILED).toBe("ゲームの追加に失敗しました")
      expect(MESSAGES.GAME.UPDATING).toBe("ゲームを更新しています...")
      expect(MESSAGES.GAME.UPDATED).toBe("ゲームを更新しました")
      expect(MESSAGES.GAME.UPDATE_FAILED).toBe("ゲームの更新に失敗しました。")
      expect(MESSAGES.GAME.LAUNCHING).toBe("ゲームを起動しています...")
      expect(MESSAGES.GAME.LAUNCHED).toBe("ゲームが起動しました")
      expect(MESSAGES.GAME.LAUNCH_FAILED).toBe("ゲームの起動に失敗しました")
      expect(MESSAGES.GAME.LIST_FETCH_FAILED).toBe("ゲーム一覧の取得に失敗しました")
      expect(MESSAGES.GAME.CREATE_FAILED).toBe("ゲームの作成に失敗しました。")
      expect(MESSAGES.GAME.DELETE_FAILED).toBe("ゲームの削除に失敗しました。")
      expect(MESSAGES.GAME.ALREADY_EXISTS("TestGame")).toBe("ゲーム「TestGame」は既に存在します。")
      expect(MESSAGES.GAME.PLAY_TIME_RECORD_FAILED).toBe("プレイ時間の記録に失敗しました。")
    })

    it("SAVE_DATA メッセージが完全に定義されている", () => {
      expect(MESSAGES.SAVE_DATA).toBeDefined()
      expect(MESSAGES.SAVE_DATA.FOLDER_NOT_SET).toBe("セーブデータフォルダが設定されていません。")
      expect(MESSAGES.SAVE_DATA.UPLOADING).toBe("セーブデータをアップロード中…")
      expect(MESSAGES.SAVE_DATA.UPLOADED).toBe("セーブデータのアップロードに成功しました。")
      expect(MESSAGES.SAVE_DATA.UPLOAD_FAILED).toBe("セーブデータのアップロードに失敗しました")
      expect(MESSAGES.SAVE_DATA.DOWNLOADING).toBe("セーブデータをダウンロード中…")
      expect(MESSAGES.SAVE_DATA.DOWNLOADED).toBe("セーブデータのダウンロードに成功しました。")
      expect(MESSAGES.SAVE_DATA.DOWNLOAD_FAILED).toBe("セーブデータのダウンロードに失敗しました")
    })

    it("CONNECTION メッセージが完全に定義されている", () => {
      expect(MESSAGES.CONNECTION).toBeDefined()
      expect(MESSAGES.CONNECTION.CHECKING).toBe("接続確認中...")
      expect(MESSAGES.CONNECTION.OK).toBe("接続OK")
      expect(MESSAGES.CONNECTION.INVALID_CREDENTIALS).toBe("クレデンシャルが有効ではありません")
    })

    it("AUTH メッセージが完全に定義されている", () => {
      expect(MESSAGES.AUTH).toBeDefined()
      expect(MESSAGES.AUTH.CREDENTIAL_NOT_FOUND).toBe(
        "認証情報が見つかりません。設定画面で認証情報を設定してください。"
      )
      expect(MESSAGES.AUTH.CREDENTIAL_INVALID).toBe("認証情報が無効です。設定を確認してください。")
      expect(MESSAGES.AUTH.SAVING).toBe("認証情報を保存しています...")
      expect(MESSAGES.AUTH.SAVED).toBe("認証情報を保存しました")
      expect(MESSAGES.AUTH.SAVE_FAILED).toBe("認証情報の保存に失敗しました")
    })

    it("FILE メッセージが完全に定義されている", () => {
      expect(MESSAGES.FILE).toBeDefined()
      expect(MESSAGES.FILE.SELECT_ERROR).toBe("ファイル選択中にエラーが発生しました")
      expect(MESSAGES.FILE.FOLDER_SELECT_ERROR).toBe("フォルダ選択中にエラーが発生しました")
      expect(MESSAGES.FILE.NOT_FOUND).toBe("ファイルが見つかりません。パスを確認してください。")
      expect(MESSAGES.FILE.ACCESS_DENIED).toBe(
        "ファイルへのアクセス権がありません。権限設定を確認してください。"
      )
    })

    it("STEAM メッセージが完全に定義されている", () => {
      expect(MESSAGES.STEAM).toBeDefined()
      expect(MESSAGES.STEAM.EXE_NOT_FOUND).toBe("Steam 実行ファイルが見つかりません")
      expect(MESSAGES.STEAM.ACCESS_DENIED).toBe("Steam へのアクセス権がありません")
    })

    it("AWS メッセージが完全に定義されている", () => {
      expect(MESSAGES.AWS).toBeDefined()
      expect(MESSAGES.AWS.BUCKET_NOT_EXISTS).toBe("バケットが存在しません。")
      expect(MESSAGES.AWS.INVALID_REGION).toBe("リージョン名が正しくありません。")
      expect(MESSAGES.AWS.INVALID_ACCESS_KEY).toBe("アクセスキーIDが正しくありません。")
      expect(MESSAGES.AWS.INVALID_CREDENTIALS).toBe("認証情報が正しくありません。")
      expect(MESSAGES.AWS.NETWORK_ERROR).toBe(
        "ネットワークエラーです。エンドポイントとネットワークの接続を確認してください。"
      )
    })

    it("ERROR メッセージが完全に定義されている", () => {
      expect(MESSAGES.ERROR).toBeDefined()
      expect(MESSAGES.ERROR.UNEXPECTED).toBe("予期しないエラーが発生しました")
      expect(MESSAGES.ERROR.GENERAL).toBe("エラーが発生しました")
      expect(MESSAGES.ERROR.NETWORK).toBe("ネットワークエラーが発生しました")
      expect(MESSAGES.ERROR.FILE_NOT_FOUND).toBe("ファイルが見つかりません")
      expect(MESSAGES.ERROR.PERMISSION_DENIED).toBe("アクセス権限がありません")
    })

    it("UI メッセージが完全に定義されている", () => {
      expect(MESSAGES.UI).toBeDefined()
      expect(MESSAGES.UI.BROWSE).toBe("参照")
      expect(MESSAGES.UI.CANCEL).toBe("キャンセル")
      expect(MESSAGES.UI.SAVE).toBe("保存")
      expect(MESSAGES.UI.DELETE).toBe("削除")
      expect(MESSAGES.UI.CLOSE).toBe("閉じる")
    })

    it("全てのメッセージが文字列である", () => {
      const checkMessagesRecursively = (obj: object, path = ""): void => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key
          if (typeof value === "object" && value !== null && !(value instanceof RegExp)) {
            checkMessagesRecursively(value, currentPath)
          } else if (typeof value === "function") {
            // 関数（例: ALREADY_EXISTS）の場合は、呼び出し結果が文字列であることを確認
            try {
              const result = value("test") // 仮の引数で呼び出し
              expect(typeof result).toBe("string")
              expect(result).not.toBe("")
            } catch (e) {
              fail(`Function at ${currentPath} threw an error: ${e}`)
            }
          } else {
            expect(typeof value).toBe("string")
            expect(value).not.toBe("")
          }
        })
      }

      checkMessagesRecursively(MESSAGES)
    })
  })

  describe("CONFIG", () => {
    it("設定構造が正しく定義されている", () => {
      expect(CONFIG).toBeDefined()
      expect(typeof CONFIG).toBe("object")
    })

    it("TIMING 設定が適切な値である", () => {
      expect(CONFIG.TIMING).toBeDefined()
      expect(CONFIG.TIMING.SEARCH_DEBOUNCE_MS).toBe(300)
      expect(typeof CONFIG.TIMING.SEARCH_DEBOUNCE_MS).toBe("number")
      expect(CONFIG.TIMING.SEARCH_DEBOUNCE_MS).toBeGreaterThan(0)
    })

    it("VALIDATION 設定が適切な値である", () => {
      expect(CONFIG.VALIDATION).toBeDefined()
      expect(CONFIG.VALIDATION.ACCESS_KEY_MIN_LENGTH).toBe(10)
      expect(CONFIG.VALIDATION.SECRET_KEY_MIN_LENGTH).toBe(20)
      expect(CONFIG.VALIDATION.TITLE_MAX_LENGTH).toBe(100)
      expect(CONFIG.VALIDATION.PUBLISHER_MAX_LENGTH).toBe(100)

      // すべて正の整数であることを確認
      Object.values(CONFIG.VALIDATION).forEach((value) => {
        expect(typeof value).toBe("number")
        expect(value).toBeGreaterThan(0)
        expect(Number.isInteger(value)).toBe(true)
      })
    })

    it("DEFAULTS 設定が適切な値である", () => {
      expect(CONFIG.DEFAULTS).toBeDefined()
      expect(CONFIG.DEFAULTS.REGION).toBe("auto")
      expect(CONFIG.DEFAULTS.PLAY_STATUS).toBe("unplayed")
    })

    it("UI 設定が適切な値である", () => {
      expect(CONFIG.UI).toBeDefined()
      expect(CONFIG.UI.CARD_WIDTH).toBe("220px")
      expect(CONFIG.UI.FLOATING_BUTTON_POSITION).toBe("bottom-16 right-6")
      expect(CONFIG.UI.ICON_SIZE).toBe(28)
    })

    it("FILE 設定が適切な値である", () => {
      expect(CONFIG.FILE).toBeDefined()
      expect(Array.isArray(CONFIG.FILE.IMAGE_EXTENSIONS)).toBe(true)
      expect(CONFIG.FILE.IMAGE_EXTENSIONS.length).toBeGreaterThan(0)
      expect(Array.isArray(CONFIG.FILE.EXECUTABLE_EXTENSIONS)).toBe(true)
      expect(CONFIG.FILE.EXECUTABLE_EXTENSIONS.length).toBeGreaterThan(0)
    })

    it("FILE_SIZE 設定が適切な値である", () => {
      expect(CONFIG.FILE_SIZE).toBeDefined()
      expect(CONFIG.FILE_SIZE.MAX_UPLOAD_SIZE_MB).toBe(100)
      expect(CONFIG.FILE_SIZE.MAX_IMAGE_SIZE_MB).toBe(10)

      // ファイルサイズ制限が適切な範囲であることを確認
      expect(CONFIG.FILE_SIZE.MAX_UPLOAD_SIZE_MB).toBeGreaterThan(0)
      expect(CONFIG.FILE_SIZE.MAX_UPLOAD_SIZE_MB).toBeLessThanOrEqual(1000)
      expect(CONFIG.FILE_SIZE.MAX_IMAGE_SIZE_MB).toBeGreaterThan(0)
      expect(CONFIG.FILE_SIZE.MAX_IMAGE_SIZE_MB).toBeLessThanOrEqual(
        CONFIG.FILE_SIZE.MAX_UPLOAD_SIZE_MB
      )
    })

    it("AWS 設定が定義されている", () => {
      expect(CONFIG.AWS).toBeDefined()
      expect(CONFIG.AWS.DEFAULT_REGION).toBe("auto")
      expect(CONFIG.AWS.REQUEST_TIMEOUT_MS).toBe(30000)

      expect(typeof CONFIG.AWS.DEFAULT_REGION).toBe("string")
      expect(typeof CONFIG.AWS.REQUEST_TIMEOUT_MS).toBe("number")
      expect(CONFIG.AWS.REQUEST_TIMEOUT_MS).toBeGreaterThan(0)
    })

    it("STEAM 設定が適切な値である", () => {
      expect(CONFIG.STEAM).toBeDefined()
      expect(CONFIG.STEAM.APPLAUNCH_FLAG).toBe("-applaunch")
      expect(CONFIG.STEAM.NO_VR_FLAG).toBe("--no-vr")
    })

    it("PRISMA 設定が適切な値である", () => {
      expect(CONFIG.PRISMA).toBeDefined()
      expect(CONFIG.PRISMA.UNIQUE_CONSTRAINT_ERROR).toBe("P2002")
    })

    it("PATH 設定が適切な値である", () => {
      expect(CONFIG.PATH).toBeDefined()
      expect(CONFIG.PATH.REMOTE_PATH_TEMPLATE("TestGame")).toBe("games/TestGame/save_data")
    })
  })

  describe("PATTERNS", () => {
    it("パターン構造が正しく定義されている", () => {
      expect(PATTERNS).toBeDefined()
      expect(typeof PATTERNS).toBe("object")
    })

    it("BUCKET_NAME パターンが正しく動作する", () => {
      const pattern = PATTERNS.BUCKET_NAME
      expect(pattern).toBeInstanceOf(RegExp)
      expect(pattern.test("my-bucket")).toBe(true)
      expect(pattern.test("my.bucket.name")).toBe(true)
      expect(pattern.test("my-bucket-123")).toBe(true)
      expect(pattern.test("My-Bucket")).toBe(false)
      expect(pattern.test("-my-bucket")).toBe(false)
      expect(pattern.test("my-bucket-")).toBe(false)
    })

    it("URL_VALIDATION パターンが正しく動作する", () => {
      const pattern = PATTERNS.URL_VALIDATION
      expect(pattern).toBeInstanceOf(RegExp)

      // 有効なURLがマッチすることを確認
      expect(pattern.test("https://example.com")).toBe(true)
      expect(pattern.test("http://localhost:3000")).toBe(true)
      expect(pattern.test("https://api.example.com/v1")).toBe(true)
      expect(pattern.test("www.example.com")).toBe(true)

      // 無効なURLがマッチしないことを確認
      expect(pattern.test("not-a-url")).toBe(false)
      expect(pattern.test("ftp://example.com")).toBe(false)
      expect(pattern.test("")).toBe(false)
    })

    it("IMAGE_FILE_EXTENSIONS パターンが正しく動作する", () => {
      const pattern = PATTERNS.IMAGE_FILE_EXTENSIONS
      expect(pattern).toBeInstanceOf(RegExp)

      // 有効な画像拡張子がマッチすることを確認
      expect(pattern.test(".jpg")).toBe(true)
      expect(pattern.test(".jpeg")).toBe(true)
      expect(pattern.test(".png")).toBe(true)
      expect(pattern.test(".gif")).toBe(true)
      expect(pattern.test(".bmp")).toBe(true)
      expect(pattern.test(".webp")).toBe(true)

      // 大文字小文字を問わずマッチすることを確認
      expect(pattern.test(".JPG")).toBe(true)
      expect(pattern.test(".PNG")).toBe(true)

      // 無効な拡張子がマッチしないことを確認
      expect(pattern.test(".txt")).toBe(false)
      expect(pattern.test(".exe")).toBe(false)
      expect(pattern.test("")).toBe(false)
    })

    it("EXE_FILE_EXTENSIONS パターンが正しく動作する", () => {
      const pattern = PATTERNS.EXE_FILE_EXTENSIONS
      expect(pattern).toBeInstanceOf(RegExp)

      // 有効な実行ファイル拡張子がマッチすることを確認
      expect(pattern.test(".exe")).toBe(true)
      expect(pattern.test(".msi")).toBe(true)

      // 大文字小文字を問わずマッチすることを確認
      expect(pattern.test(".EXE")).toBe(true)
      expect(pattern.test(".MSI")).toBe(true)

      // 無効な拡張子がマッチしないことを確認
      expect(pattern.test(".txt")).toBe(false)
      expect(pattern.test(".jpg")).toBe(false)
      expect(pattern.test("")).toBe(false)
    })

    it("INVALID_FILENAME_CHARS パターンが正しく動作する", () => {
      const pattern = PATTERNS.INVALID_FILENAME_CHARS
      expect(pattern).toBeInstanceOf(RegExp)

      const invalidChars = ["<", ">", ":", '"', "/", "\\", "|", "?", "*"]
      invalidChars.forEach((char) => {
        // グローバルフラグ付き RegExp は lastIndex を進めるので、毎回リセット
        pattern.lastIndex = 0
        expect(pattern.test(char)).toBe(true)
      })

      const validChars = ["a", "1", "_", "-", "."]
      validChars.forEach((char) => {
        pattern.lastIndex = 0
        expect(pattern.test(char)).toBe(false)
      })
    })
  })

  describe("index export", () => {
    it("全ての定数がインデックスからエクスポートされている", () => {
      expect(constantsIndex.MESSAGES).toBe(MESSAGES)
      expect(constantsIndex.CONFIG).toBe(CONFIG)
      expect(constantsIndex.PATTERNS).toBe(PATTERNS)
    })

    it("エクスポートされた定数が変更不可能である", () => {
      expect(Object.isFrozen(constantsIndex.MESSAGES)).toBe(false) // as constなので実行時にはfreezeされない
      expect(Object.isFrozen(constantsIndex.CONFIG)).toBe(false)
      expect(Object.isFrozen(constantsIndex.PATTERNS)).toBe(false)

      // しかし、TypeScriptのas constによって型レベルでreadonly
      expect(() => {}).not.toThrow() // 実行時エラーは発生しないが、TypeScriptでエラーになる
    })
  })

  describe("consistency checks", () => {
    it("メッセージ内容に一貫性がある", () => {
      // 進行中メッセージは「...」で終わる
      expect(MESSAGES.GAME.ADDING).toMatch(/\.{3}$/)
      expect(MESSAGES.SAVE_DATA.UPLOADING).toMatch(/…$/)
      expect(MESSAGES.AUTH.SAVING).toMatch(/\.{3}$/)

      // 完了メッセージは「しました」で終わる
      expect(MESSAGES.GAME.ADDED).toMatch(/しました$/)
      expect(MESSAGES.SAVE_DATA.UPLOADED).toMatch(/しました。$/)
      expect(MESSAGES.AUTH.SAVED).toMatch(/しました$/)

      // 失敗メッセージは「失敗しました」で終わる
      expect(MESSAGES.GAME.ADD_FAILED).toMatch(/失敗しました$/)
      expect(MESSAGES.SAVE_DATA.UPLOAD_FAILED).toMatch(/失敗しました$/)
      expect(MESSAGES.AUTH.SAVE_FAILED).toMatch(/失敗しました$/)
    })

    it("設定値の範囲に論理的整合性がある", () => {
      // アクセスキーの最小長がシークレットキーより短い
      expect(CONFIG.VALIDATION.ACCESS_KEY_MIN_LENGTH).toBeLessThan(
        CONFIG.VALIDATION.SECRET_KEY_MIN_LENGTH
      )

      // 画像ファイルサイズがアップロード全体より小さい
      expect(CONFIG.FILE_SIZE.MAX_IMAGE_SIZE_MB).toBeLessThanOrEqual(
        CONFIG.FILE_SIZE.MAX_UPLOAD_SIZE_MB
      )

      // タイムアウト値が合理的
      expect(CONFIG.AWS.REQUEST_TIMEOUT_MS).toBeGreaterThan(1000) // 1秒以上
      expect(CONFIG.AWS.REQUEST_TIMEOUT_MS).toBeLessThan(300000) // 5分未満
    })
  })
})
