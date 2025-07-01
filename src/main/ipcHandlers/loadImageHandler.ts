import { ipcMain } from "electron"
import path from "path"
import fs from "fs/promises"

const mimeMap: Record<string, string> = {
  png: "image/png",
  gif: "image/gif",
  jpeg: "image/jpeg"
}

export function registerLoadImageHandler(): void {
  ipcMain.handle("load-image", async (_event, filePath: string): Promise<string | null> => {
    try {
      const buffer = await fs.readFile(filePath)
      const ext = path.extname(filePath).slice(1).toLocaleLowerCase()
      const mime = mimeMap[ext] || "image/jpeg"
      return `data:${mime};base64,${buffer.toString("base64")}`
    } catch (e) {
      console.error(`load-image failed ${e}`)
      return null
    }
  })
}
