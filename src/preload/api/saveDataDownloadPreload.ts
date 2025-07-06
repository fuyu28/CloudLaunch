import { ipcRenderer } from "electron"
import { ApiResult } from "../../types/result"

export const saveDataDownloadAPI = {
  downloadSaveData: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("download-save-data", localSaveFolderPath, remoteSaveDataPath),

  getCloudDataInfo: (
    gameId: string
  ): Promise<ApiResult<{ exists: boolean; uploadedAt?: Date; size?: number; comment?: string }>> =>
    ipcRenderer.invoke("get-cloud-data-info", gameId)
}
