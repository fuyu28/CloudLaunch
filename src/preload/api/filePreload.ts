import { ipcRenderer } from "electron"
import { ValidatePathResult } from "../../types/file"

export const fileAPI = {
  selectFile: (filters: Electron.FileFilter[]): Promise<string | null> =>
    ipcRenderer.invoke("select-file", filters),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke("select-folder"),
  validateFile: (filePath: string, expectType?: string): Promise<ValidatePathResult> =>
    ipcRenderer.invoke("validate-file", filePath, expectType)
}
