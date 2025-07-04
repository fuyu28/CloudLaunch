/**
 * @fileoverview ゲーム起動機能のIPC通信ハンドラー
 *
 * このファイルは、ローカルゲームの起動機能を提供します。
 *
 * 提供する機能：
 * - 実行ファイル直接起動（launch-game）
 * - Steam経由でのゲーム起動（launch-game-from-steam）
 *
 * セキュリティ機能：
 * - 実行前のファイル存在・形式検証
 * - パストラバーサル攻撃対策
 * - 権限チェック（実行可能ファイルの検証）
 *
 * 技術的特徴：
 * - child_process.spawn による安全なプロセス起動
 * - detached モードでの独立プロセス実行
 * - 作業ディレクトリの自動設定
 * - Steam URL形式の検証とsteam://プロトコル対応
 *
 * エラーハンドリング：
 * - 構造化エラー情報（ERROR_CODES使用）
 * - ファイル不存在・権限エラー・起動失敗の詳細分析
 * - ユーザーフレンドリーなエラーメッセージ
 */

import { ipcMain } from "electron"
import { spawn } from "child_process"
import * as path from "path"
import { ApiResult } from "../../types/result"
import { PathType } from "../../types/file"
import { validatePathWithType } from "../utils/file"
import { createErrorResult, createAppError, ERROR_CODES } from "../utils/errorHandler"
import { logger } from "../utils/logger"

export function registerLaunchGameHandlers(): void {
  /**
   * ゲーム実行ファイル直接起動API
   *
   * 指定された実行ファイルパスのゲームを直接起動します。
   *
   * 処理フロー：
   * 1. ファイル存在・形式検証（validatePathWithType使用）
   * 2. 実行ファイルの権限確認
   * 3. 作業ディレクトリの設定（実行ファイルの親ディレクトリ）
   * 4. child_process.spawn によるプロセス起動
   * 5. detached モードでの独立実行
   *
   * セキュリティチェック：
   * - 実行ファイル形式の検証（.exe、マジックナンバー確認）
   * - ファイルアクセス権限の確認
   * - パストラバーサル攻撃対策
   *
   * @param filePath 起動する実行ファイルの絶対パス
   * @returns ApiResult 起動結果（成功時はsuccess: true、失敗時は詳細なエラー情報）
   */
  ipcMain.handle("launch-game", async (_event, filePath: string): Promise<ApiResult> => {
    try {
      // 1. 存在＆形式チェック
      const res = await validatePathWithType(filePath, PathType.Executable)
      if (!res.ok) {
        let message: string
        let errorCode: string

        switch (res.errorType) {
          case PathType.NotFound:
            message = "ファイルが見つかりません。パスを確認してください。"
            errorCode = "FILE_NOT_FOUND"
            break
          case PathType.NoPermission:
            message = "ファイルへのアクセス権がありません。権限設定を確認してください。"
            errorCode = "PERMISSION_DENIED"
            break
          case PathType.File:
          case PathType.UnknownError:
          default:
            message = `期待した実行可能ファイルではありません（検出形式: ${res.type}）`
            errorCode = "VALIDATION_ERROR"
        }

        throw createAppError(errorCode as keyof typeof ERROR_CODES, message, `Path: ${filePath}`)
      }

      // 2. プロセス起動
      const workingDirectory = path.dirname(filePath)
      const child = spawn(filePath, [], {
        cwd: workingDirectory,
        detached: true,
        stdio: "ignore",
        env: { ...process.env }
      })

      child.on("error", (err) => {
        logger.error("ゲーム起動エラー:", err)
      })

      child.unref()
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "ゲーム起動")
    }
  })

  /**
   * Steam経由ゲーム起動API
   *
   * Steam URLとSteam実行ファイルパスを使用してSteam経由でゲームを起動します。
   *
   * 処理フロー：
   * 1. Steam URL形式の検証（steam://rungameid/[数字] 形式）
   * 2. Steam実行ファイルの存在・形式検証
   * 3. Steam プロセスにURL引数を渡して起動
   * 4. detached モードでの独立実行
   *
   * 対応URL形式：
   * - steam://rungameid/[Steam App ID] （例: steam://rungameid/292030）
   *
   * セキュリティチェック：
   * - URL形式の厳密な検証（正規表現使用）
   * - Steam実行ファイルの存在・権限確認
   * - 数値以外のApp IDの拒否
   *
   * @param url Steam起動URL（steam://rungameid/[数字] 形式）
   * @param steamPath Steam実行ファイルの絶対パス
   * @returns ApiResult 起動結果（成功時はsuccess: true、失敗時は詳細なエラー情報）
   */
  ipcMain.handle(
    "launch-game-from-steam",
    async (_event, url: string, steamPath: string): Promise<ApiResult> => {
      try {
        // 1. URL フォーマット検証 & gameId 抽出
        const match = url.match(/^steam:\/\/rungameid\/([0-9]+)$/)
        if (!match) {
          throw createAppError("VALIDATION_ERROR", "Invalid Steam URL", `URL: ${url}`)
        }
        const runGameId = match[1]

        // 2. steamPathのチェック
        const val = await validatePathWithType(steamPath, PathType.Executable)
        if (!val.ok) {
          const message =
            val.errorType === PathType.NotFound
              ? "Steam 実行ファイルが見つかりません"
              : "Steam へのアクセス権がありません"
          const errorCode =
            val.errorType === PathType.NotFound ? "FILE_NOT_FOUND" : "PERMISSION_DENIED"
          throw createAppError(
            errorCode as keyof typeof ERROR_CODES,
            message,
            `Steam Path: ${steamPath}`
          )
        }

        // 3. 実行
        const args = ["-applaunch", runGameId, "--no-vr"]
        const child = spawn(steamPath, args, {
          detached: true,
          stdio: "ignore",
          env: { ...process.env }
        })

        child.on("error", (err) => logger.error("Steam経由ゲーム起動エラー:", err))
        child.unref()
        return { success: true }
      } catch (error) {
        return createErrorResult(error, "Steam経由でのゲーム起動")
      }
    }
  )
}
