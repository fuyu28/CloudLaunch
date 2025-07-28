import { ipcMain, shell } from "electron"

import type { BrowserWindow } from "electron"

export function registerWindowHandler(win: BrowserWindow): void {
  ipcMain.handle("minimize-window", () => {
    win.minimize()
  })
  ipcMain.handle("toggle-maximize-window", () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle("close-window", () => {
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
