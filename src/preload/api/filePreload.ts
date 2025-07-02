import { ipcRenderer } from "electron"
import { ValidatePathResult } from "../../types/file"

export const fileAPI = {
  selectAppExe: (): Promise<string | null> => ipcRenderer.invoke("select-app-exe"),
  selectSaveDataFolder: (): Promise<string | null> => ipcRenderer.invoke("select-save-data-folder"),
  validateFile: (filePath: string, expectType?: string): Promise<ValidatePathResult> =>
    ipcRenderer.invoke("validate-file", filePath, expectType)
}
