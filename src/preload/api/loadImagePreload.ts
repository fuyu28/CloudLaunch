import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

export const loadImageAPI = {
  loadImageFromLocal: (filePath: string): Promise<ApiResult<string>> =>
    ipcRenderer.invoke("load-image-from-local", filePath),
  loadImageFromWeb: (url: string): Promise<ApiResult<string>> =>
    ipcRenderer.invoke("load-image-from-web", url)
}
