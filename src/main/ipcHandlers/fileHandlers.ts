import { ipcMain, dialog } from "electron"
import { validatePathWithType } from "../utils/file"
import { ValidatePathResult } from "../../types/file"

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

  ipcMain.handle(
    "validate-file",
    async (_event, filePath: string, expectType?: string): Promise<ValidatePathResult> => {
      return validatePathWithType(filePath, expectType)
    }
  )
}
