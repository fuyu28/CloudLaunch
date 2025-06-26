import { ipcRenderer } from "electron"

export const downloadAPI = {
  downloadFolder: (
    localFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("download-folder", localFolderPath, r2DestinationPath)
}
