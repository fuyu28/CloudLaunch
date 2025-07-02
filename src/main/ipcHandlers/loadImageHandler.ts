import { ipcMain } from "electron"
import path from "path"
import fs from "fs/promises"

const mimeMap: Record<string, string> = {
  png: "image/png",
  gif: "image/gif",
  jpeg: "image/jpeg"
}

export function registerLoadImageHandler(): void {
  ipcMain.handle(
    "load-image-from-local",
    async (_event, filePath: string): Promise<string | null> => {
      try {
        const buffer = await fs.readFile(filePath)
        const ext = path.extname(filePath).slice(1).toLocaleLowerCase()
        const mime = mimeMap[ext] || "image/jpeg"
        return `data:${mime};base64,${buffer.toString("base64")}`
      } catch (e) {
        console.error(`load-image failed ${e}`)
        return null
      }
    }
  )

  ipcMain.handle("load-image-from-web", async (_event, url: string): Promise<string | null> => {
    try {
      // Data URI処理
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const contentType = res.headers.get("content-type") || ""
      // png | jpeg ならOK
      if (!/^image\/(png|jpeg)$/.test(contentType)) {
        console.warn(`Blocked by MIME policy: ${contentType}`)
        return null
      }
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      return `data:${contentType};base64,${base64}`
    } catch (e) {
      console.error(e)
      return null
    }
  })
}
