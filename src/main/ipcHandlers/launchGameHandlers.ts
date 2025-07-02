import { ipcMain } from "electron"
import { spawn } from "child_process"
import * as path from "path"
import { ApiResult } from "../../types/result"
import { validatePathWithType } from "../utils/file"

export enum PathType {
  Directory = "Directory",
  Executable = "Executable",
  File = "File",
  NotFound = "NotFound",
  NoPermission = "NoPermission",
  UnknownError = "UnknownError"
}

export function registerLaunchGameHandlers(): void {
  ipcMain.handle("launch-game", async (_event, filePath: string): Promise<ApiResult> => {
    // 1. 存在＆形式チェック
    const res = await validatePathWithType(filePath, PathType.Executable)
    if (!res.ok) {
      let message: string
      switch (res.errorType) {
        case PathType.NotFound:
          message = "ファイルが見つかりません。パスを確認してください。"
          break
        case PathType.NoPermission:
          message = "ファイルへのアクセス権がありません。権限設定を確認してください。"
          break
        case PathType.File:
        case PathType.UnknownError:
        default:
          message = `期待した実行可能ファイルではありません（検出形式: ${res.type}）`
      }
      console.error("Launch validation failed:", res)
      return { success: false, message }
    }

    // 2. プロセス起動
    try {
      const workPath = path.dirname(filePath)
      const child = spawn(filePath, [], {
        cwd: workPath,
        detached: true,
        stdio: "ignore",
        env: { ...process.env }
      })
      child.on("error", (err) => {
        console.error("Spawn error:", err)
      })
      child.unref()
      return { success: true }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Spawn exception:", err)
      return {
        success: false,
        message: `ゲームの起動時にエラーが発生しました: ${err.message || err}`
      }
    }
  })

  ipcMain.handle(
    "launch-game-from-steam",
    async (_event, url: string, steamPath: string): Promise<ApiResult> => {
      // 1. URL フォーマット検証 & gameId 抽出
      const match = url.match(/^steam:\/\/rungameid\/([0-9]+)$/)
      if (!match) return { success: false, message: "Invalid Steam URL" }
      const runGameId = match[1]

      // 2. steamPathのチェック
      const val = await validatePathWithType(steamPath, PathType.Executable)
      if (!val.ok) {
        return {
          success: false,
          message:
            val.errorType === PathType.NotFound
              ? "Steam 実行ファイルが見つかりません"
              : "Steam へのアクセス権がありません"
        }
      }

      // 3. 実行
      try {
        const args = ["-applaunch", runGameId, "--no-vr"]
        const child = spawn(steamPath, args, {
          detached: true,
          stdio: "ignore",
          env: { ...process.env }
        })
        child.on("error", (err) => console.error("Steam spawn error:", err))
        child.unref()
        return { success: true }
      } catch (err) {
        console.error("Spawn exception:", err)
        return { success: false, message: `ゲームの起動に失敗しました: ${err}` }
      }
    }
  )
}
