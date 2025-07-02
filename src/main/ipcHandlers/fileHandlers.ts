import { ipcMain, dialog } from "electron"
import { validatePathWithType } from "../utils/file"
import { ValidatePathResult } from "../../types/file"

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

  ipcMain.handle(
    "validate-file",
    async (_event, filePath: string, expectType?: string): Promise<ValidatePathResult> => {
      return validatePathWithType(filePath, expectType)
    }
  )
}
