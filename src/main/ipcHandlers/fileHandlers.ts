/**
 * @fileoverview ファイル・フォルダ選択ダイアログとパス検証のIPC通信ハンドラー
 *
 * このファイルは、ユーザーからのファイル・フォルダ選択要求とファイルパス検証機能を提供します。
 *
 * 提供する機能：
 * - ファイル選択ダイアログ（select-file）
 * - フォルダ選択ダイアログ（select-folder）
 * - ファイルパス・種類検証（validate-file）
 *
 * セキュリティ機能：
 * - ネイティブElectronダイアログによる安全なファイル選択
 * - ファイル種別フィルターによる選択制限
 * - パストラバーサル攻撃対策を含むパス検証
 *
 * 技術的特徴：
 * - レンダラープロセスから直接ファイルシステムにアクセスしない設計
 * - 統一されたエラーハンドリングとユーザーフレンドリーなメッセージ
 */

import * as fs from "fs"

import { ipcMain, dialog, shell } from "electron"
import { ZodError } from "zod"

import { MESSAGES } from "../../constants"
import { fileSelectionSchema, fileExistenceSchema } from "../../schemas/file"
import type { ValidatePathResult } from "../../types/file"
import { PathType } from "../../types/file"
import type { ApiResult } from "../../types/result"
import { validatePathWithType } from "../utils/file"
import { logger } from "../utils/logger"

export function registerFileDialogHandlers(): void {
  /**
   * ファイル選択ダイアログAPI
   *
   * ネイティブのElectronファイル選択ダイアログを表示し、ユーザーにファイルを選択させます。
   * 指定されたフィルターによって選択可能なファイル種別を制限できます。
   *
   * 使用例：
   * - ゲーム実行ファイルの選択（.exeフィルター）
   * - ゲームアイコンの選択（画像ファイルフィルター）
   *
   * @param filters ファイル種別フィルター配列（nameとextensionsを指定）
   * @returns ApiResult<string | undefined> 選択結果（選択時はファイルパス、キャンセル時はundefined）
   */
  ipcMain.handle(
    "file:select",
    async (_event, filters: Electron.FileFilter[]): Promise<ApiResult<string | undefined>> => {
      try {
        // Zodスキーマでフィルターを検証
        const validationData = fileSelectionSchema.parse({
          filters: filters || [],
          properties: ["openFile"]
        })

        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ["openFile"],
          filters: validationData.filters
        })
        return { success: true, data: canceled ? undefined : filePaths[0] }
      } catch (e: unknown) {
        if (e instanceof ZodError) {
          return {
            success: false,
            message: `入力データが無効です: ${e.issues.map((issue) => issue.message).join(", ")}`
          }
        }
        logger.error("ファイル選択エラー:", e)
        const message = e instanceof Error ? e.message : MESSAGES.IPC_ERROR.UNKNOWN
        return { success: false, message: MESSAGES.IPC_ERROR.FILE_SELECTION_FAILED(message) }
      }
    }
  )

  /**
   * フォルダ選択ダイアログAPI
   *
   * ネイティブのElectronフォルダ選択ダイアログを表示し、ユーザーにディレクトリを選択させます。
   *
   * 使用例：
   * - ゲームのセーブデータフォルダの選択
   * - アップロード・ダウンロード先フォルダの選択
   *
   * @returns ApiResult<string | undefined> 選択結果（選択時はフォルダパス、キャンセル時はundefined）
   */
  ipcMain.handle("folder:select", async (): Promise<ApiResult<string | undefined>> => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      })
      return { success: true, data: canceled ? undefined : filePaths[0] }
    } catch (e: unknown) {
      logger.error("フォルダ選択エラー:", e)
      const message = e instanceof Error ? e.message : MESSAGES.IPC_ERROR.UNKNOWN
      return { success: false, message: MESSAGES.IPC_ERROR.FOLDER_SELECTION_FAILED(message) }
    }
  })

  /**
   * ファイルパス・種類検証API
   *
   * 指定されたファイルパスの存在確認とファイル種別の検証を行います。
   *
   * 検証機能：
   * - ファイル・ディレクトリの存在確認
   * - ファイル種別の自動判定（マジックナンバー解析）
   * - 期待するファイル種別との照合
   * - アクセス権限の確認
   *
   * セキュリティ機能：
   * - パストラバーサル攻撃対策
   * - ファイルシステムエラーの適切な処理
   *
   * @param filePath 検証するファイルパス（絶対パス推奨）
   * @param expectType 期待するファイル種別（省略時は存在確認のみ）
   * @returns ValidatePathResult 検証結果（ok: true/false、type: 検出された種別、errorType: エラー種別）
   */
  ipcMain.handle(
    "file:validate",
    async (_event, filePath: string, expectType?: string): Promise<ValidatePathResult> => {
      try {
        // Zodスキーマでファイルパスを検証
        const validationData = fileExistenceSchema.parse({
          path: filePath,
          type: "file",
          checkAccess: true
        })

        return validatePathWithType(validationData.path, expectType)
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            ok: false,
            type: undefined,
            errorType: PathType.UnknownError
          }
        }
        return validatePathWithType(filePath, expectType)
      }
    }
  )

  /**
   * ファイル存在チェックAPI
   *
   * 指定されたパスにファイルが存在するかをチェックします。
   *
   * @param filePath チェックするファイルパス
   * @returns boolean ファイルが存在する場合true
   */
  ipcMain.handle("file:exists", async (_event, filePath: string): Promise<boolean> => {
    try {
      // Zodスキーマでファイルパスを検証
      const validationData = fileExistenceSchema.parse({
        path: filePath,
        type: "file"
      })

      if (!validationData.path || validationData.path.trim() === "") {
        logger.warn(`空のファイルパスが渡されました`)
        return false
      }

      // fs.existsSyncを使用してシンプルに存在確認
      const exists = fs.existsSync(validationData.path)

      if (!exists) {
        return false
      }

      // 存在する場合はファイルかディレクトリかをチェック
      const stats = fs.statSync(validationData.path)
      return stats.isFile()
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`無効なファイルパス: ${error.issues.map((issue) => issue.message).join(", ")}`)
        return false
      }
      logger.error(`ファイル存在チェックエラー: "${filePath}"`, error)
      return false
    }
  })

  /**
   * ディレクトリ存在チェックAPI
   *
   * 指定されたパスにディレクトリが存在するかをチェックします。
   *
   * @param dirPath チェックするディレクトリパス
   * @returns boolean ディレクトリが存在する場合true
   */
  ipcMain.handle("folder:exists", async (_event, dirPath: string): Promise<boolean> => {
    try {
      if (!dirPath || dirPath.trim() === "") {
        logger.warn(`空のディレクトリパスが渡されました`)
        return false
      }

      // fs.existsSyncを使用して存在確認
      const exists = fs.existsSync(dirPath)

      if (!exists) {
        return false
      }

      // 存在する場合はディレクトリかファイルかをチェック
      const stats = fs.statSync(dirPath)
      return stats.isDirectory()
    } catch (error) {
      logger.error(`ディレクトリ存在チェックエラー: "${dirPath}"`, error)
      return false
    }
  })

  /**
   * ログディレクトリを開くAPI
   *
   * アプリケーションのログディレクトリをシステムのファイルエクスプローラーで開きます。
   * ユーザーがログファイルを確認できるようにします。
   *
   * @returns ApiResult<void> 操作結果
   */
  ipcMain.handle("logs:open-directory", async (): Promise<ApiResult<void>> => {
    try {
      const logDirectory = logger.getLogDirectoryPath()

      // ログディレクトリが存在することを確認
      if (!fs.existsSync(logDirectory)) {
        logger.warn("ログディレクトリが存在しません", { logDirectory })
        return {
          success: false,
          message: "ログディレクトリが見つかりませんでした"
        }
      }

      // システムのファイルエクスプローラーでディレクトリを開く
      await shell.openPath(logDirectory)

      logger.info("ログディレクトリを開きました", { logDirectory })
      return { success: true }
    } catch (error) {
      logger.error("ログディレクトリを開くことに失敗しました", error)
      const message = error instanceof Error ? error.message : "不明なエラー"
      return {
        success: false,
        message: `ログディレクトリを開くことができませんでした: ${message}`
      }
    }
  })

  /**
   * ログファイルパスを取得するAPI
   *
   * 現在のログファイルの絶対パスを取得します。
   *
   * @returns ApiResult<string> ログファイルパス
   */
  ipcMain.handle("logs:get-path", async (): Promise<ApiResult<string>> => {
    try {
      const logFilePath = logger.getLogFilePath()
      return { success: true, data: logFilePath }
    } catch (error) {
      logger.error("ログファイルパスの取得に失敗しました", error)
      const message = error instanceof Error ? error.message : "不明なエラー"
      return {
        success: false,
        message: `ログファイルパスを取得できませんでした: ${message}`
      }
    }
  })
}
