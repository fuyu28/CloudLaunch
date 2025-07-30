import { ipcMain, shell } from "electron"

import type { BrowserWindow } from "electron"

export function registerWindowHandler(win: BrowserWindow): void {
  ipcMain.handle("window:minimize", () => {
    win.minimize()
  })
  ipcMain.handle("window:toggleMaximize", () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle("window:close", () => {
    win.close()
  })

  ipcMain.handle("open-folder", async (_, folderPath: string) => {
    try {
      await shell.openPath(folderPath)
      return { success: true }
    } catch {
      return { success: false, message: "フォルダを開けませんでした" }
    }
  })
}
