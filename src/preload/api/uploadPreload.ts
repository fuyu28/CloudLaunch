import { ipcRenderer } from "electron"

export const uploadAPI = {
  uploadFolder: (
    localFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("upload-folder", localFolderPath, r2DestinationPath)
}
