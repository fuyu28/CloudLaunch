import { ipcMain, dialog } from "electron"

export function registerFileDialogHandlers(): void {
  ipcMain.handle(
    "select-file",
    async (_event, filters: Electron.FileFilter[]): Promise<string | null> => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters
      })
      return canceled ? null : filePaths[0]
    }
  )

  ipcMain.handle("select-folder", async (): Promise<string | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    })
    return canceled ? null : filePaths[0]
  })
}
