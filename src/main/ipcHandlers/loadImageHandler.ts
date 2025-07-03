import { ipcMain } from "electron"
import path from "path"
import fs from "fs/promises"
import { ApiResult } from "../../types/result"

const mimeMap: Record<string, string> = {
  png: "image/png",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg"
}

export function registerLoadImageHandler(): void {
  ipcMain.handle(
    "load-image-from-local",
    async (_event, filePath: string): Promise<ApiResult<string>> => {
      try {
        const buffer = await fs.readFile(filePath)
        const ext = path.extname(filePath).slice(1).toLocaleLowerCase()
        const mime = mimeMap[ext] || "image/jpeg"
        const base64 = buffer.toString("base64")
        return { success: true, data: `data:${mime};base64,${base64}` }
      } catch (e: unknown) {
        console.error(`load-image failed ${e}`)
        const message = e instanceof Error ? e.message : "不明なエラー"
        return { success: false, message: `ローカル画像の読み込みに失敗しました: ${message}` }
      }
    }
  )

  ipcMain.handle("load-image-from-web", async (_event, url: string): Promise<ApiResult<string>> => {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        return { success: false, message: `画像の取得に失敗しました: ${res.statusText}` }
      }

      const contentType = res.headers.get("content-type") || ""
      if (!/^image\/(png|jpeg|gif)$/.test(contentType)) {
        return { success: false, message: `非対応の画像形式です: ${contentType}` }
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      return { success: true, data: `data:${contentType};base64,${base64}` }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : "不明なエラー"
      return { success: false, message: `Web画像の読み込みに失敗しました: ${message}` }
    }
  })
}
