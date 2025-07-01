import { ipcRenderer } from "electron"

export const saveDataDownloadAPI = {
  downloadSaveData: (
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("download-save-data", localSaveFolderPath, remoteSaveDataPath)
}
