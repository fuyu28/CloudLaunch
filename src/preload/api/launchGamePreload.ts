import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

export const launchGameAPI = {
  launchGame: (filePath: string): Promise<ApiResult> => ipcRenderer.invoke("game:launch", filePath),
  launchGameFromSteam: (url: string, steamPath: string): Promise<ApiResult> =>
    ipcRenderer.invoke("game:launchFromSteam", url, steamPath)
}
