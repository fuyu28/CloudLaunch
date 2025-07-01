import { ipcMain, dialog } from "electron"

export function registerFileDialogHandlers(): void {
  ipcMain.handle("select-app-exe", async (): Promise<string | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Executable Files", extensions: ["exe"] }]
    })
    return canceled ? null : filePaths[0]
  })

  ipcMain.handle("select-save-data-folder", async (): Promise<string | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    })
    return canceled ? null : filePaths[0]
  })
}
