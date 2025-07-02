import { ipcRenderer } from "electron"
import { ApiResult } from "../../types/result"

export const launchGameAPI = {
  launchGame: (filePath: string): Promise<ApiResult> => ipcRenderer.invoke("launch-game", filePath),
  launchGameFromSteam: (url: string, steamPath: string): Promise<ApiResult> =>
    ipcRenderer.invoke("launch-game-from-steam", url, steamPath)
}
