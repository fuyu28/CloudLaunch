import { ipcRenderer } from "electron"
import { ApiResult } from "../../types/result"

export const saveDataUploadAPI = {
  uploadSaveDataFolder: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("upload-save-data-folder", localSaveFolderPath, remoteSaveDataPath)
}
