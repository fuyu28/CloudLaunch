import { ipcMain } from "electron"
import { spawn } from "child_process"
import * as path from "path"
import { ApiResult } from "../../types/result"
import { PathType } from "../../types/file"
import { validatePathWithType } from "../utils/file"
import { createErrorResult, createAppError, ERROR_CODES } from "../utils/errorHandler"

export function registerLaunchGameHandlers(): void {
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
        console.error("Spawn error:", err)
      })

      child.unref()
      return { success: true }
    } catch (error) {
      return createErrorResult(error, "ゲーム起動")
    }
  })

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

        child.on("error", (err) => console.error("Steam spawn error:", err))
        child.unref()
        return { success: true }
      } catch (error) {
        return createErrorResult(error, "Steam経由でのゲーム起動")
      }
    }
  )
}
