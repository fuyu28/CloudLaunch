import { BrowserWindow, ipcMain } from "electron"

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
}
