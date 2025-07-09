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

import { ipcMain, dialog } from "electron"
import { validatePathWithType } from "../utils/file"
import { ValidatePathResult } from "../../types/file"
import { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"
import { MESSAGES } from "../../constants"

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
    "select-file",
    async (_event, filters: Electron.FileFilter[]): Promise<ApiResult<string | undefined>> => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ["openFile"],
          filters
        })
        return { success: true, data: canceled ? undefined : filePaths[0] }
      } catch (e: unknown) {
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
  ipcMain.handle("select-folder", async (): Promise<ApiResult<string | undefined>> => {
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
    "validate-file",
    async (_event, filePath: string, expectType?: string): Promise<ValidatePathResult> => {
      return validatePathWithType(filePath, expectType)
    }
  )
}
