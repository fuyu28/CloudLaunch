import { ipcRenderer } from "electron"
import { ApiResult } from "../../types/result"

export const saveDataDownloadAPI = {
  downloadSaveData: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("download-save-data", localSaveFolderPath, remoteSaveDataPath)
}
