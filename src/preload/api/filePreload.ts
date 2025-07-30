import { ipcRenderer } from "electron"

import type { ValidatePathResult } from "../../types/file"
import type { ApiResult } from "../../types/result"

export const fileAPI = {
  selectFile: (filters: Electron.FileFilter[]): Promise<ApiResult<string | undefined>> =>
    ipcRenderer.invoke("file:select", filters),
  selectFolder: (): Promise<ApiResult<string | undefined>> => ipcRenderer.invoke("folder:select"),
  validateFile: (filePath: string, expectType?: string): Promise<ValidatePathResult> =>
    ipcRenderer.invoke("file:validate", filePath, expectType),
  checkFileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke("file:exists", filePath),
  checkDirectoryExists: (dirPath: string): Promise<boolean> =>
    ipcRenderer.invoke("folder:exists", dirPath)
}
