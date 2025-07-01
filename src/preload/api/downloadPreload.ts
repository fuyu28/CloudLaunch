import { ipcRenderer } from "electron"

export const downloadAPI = {
  downloadFolder: (
    localSaveFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("download-folder", localSaveFolderPath, r2DestinationPath)
}
