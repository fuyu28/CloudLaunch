import { ipcRenderer } from "electron"

export const saveDataUploadAPI = {
  uploadSaveDataFolder: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("upload-save-data-folder", localSaveFolderPath, remoteSaveDataPath)
}
