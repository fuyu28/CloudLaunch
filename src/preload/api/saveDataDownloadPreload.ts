import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

export const saveDataDownloadAPI = {
  downloadSaveData: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("cloud:downloadSaveData", localSaveFolderPath, remoteSaveDataPath),

  getCloudDataInfo: (
    gameId: string
  ): Promise<ApiResult<{ exists: boolean; uploadedAt?: Date; size?: number; comment?: string }>> =>
    ipcRenderer.invoke("cloud:getDataInfo", gameId),

  getCloudFileDetails: (
    gameId: string
  ): Promise<
    ApiResult<{
      exists: boolean
      totalSize: number
      files: Array<{
        name: string
        size: number
        lastModified: Date
        key: string
      }>
    }>
  > => ipcRenderer.invoke("cloud:getFileDetails", gameId)
}
