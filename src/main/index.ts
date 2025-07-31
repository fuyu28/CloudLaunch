import { join } from "path"

import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import { app, shell, BrowserWindow, ipcMain } from "electron"

import { registerWindowHandler } from "./ipcHandlers/windowsHandler"
import { registerAllHandlers } from "./registerHandlers"
import { ProcessMonitorService } from "./service/processMonitorService"
import { setupGlobalErrorHandlers } from "./utils/errorHandler"
import { logger } from "./utils/logger"
import icon from "../../build/icon.ico?asset"

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1050,
    height: 750,
    minWidth: 550,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: "hidden",
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  registerWindowHandler(mainWindow)
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron")

  // Setup global error handlers
  setupGlobalErrorHandlers()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Handler
  registerAllHandlers()

  // IPC test
  ipcMain.on("ping", () => logger.debug("pong"))

  createWindow()

  // プロセス監視を開始（自動ゲーム検出設定に関係なく）
  setTimeout(async () => {
    const monitor = ProcessMonitorService.getInstance()
    await monitor.startMonitoring()
    logger.info("アプリケーション起動時にプロセス監視を開始しました")
  }, 2000) // 2秒後に開始（UIの初期化を待つ）

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
