import { ipcMain, dialog } from "electron"
import { validatePathWithType } from "../utils/file"
import { ValidatePathResult } from "../../types/file"
import { ApiResult } from "../../types/result"

export function registerFileDialogHandlers(): void {
  ipcMain.handle(
    "select-file",
    async (_event, filters: Electron.FileFilter[]): Promise<ApiResult<string | null>> => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ["openFile"],
          filters
        })
        return { success: true, data: canceled ? null : filePaths[0] }
      } catch (e: unknown) {
        console.error(e)
        const message = e instanceof Error ? e.message : "不明なエラー"
        return { success: false, message: `ファイル選択中にエラーが発生しました: ${message}` }
      }
    }
  )

  ipcMain.handle("select-folder", async (): Promise<ApiResult<string | null>> => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      })
      return { success: true, data: canceled ? null : filePaths[0] }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : "不明なエラー"
      return { success: false, message: `フォルダ選択中にエラーが発生しました: ${message}` }
    }
  })

  ipcMain.handle(
    "validate-file",
    async (_event, filePath: string, expectType?: string): Promise<ValidatePathResult> => {
      return validatePathWithType(filePath, expectType)
    }
  )
}
