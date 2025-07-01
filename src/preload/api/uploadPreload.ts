import { ipcRenderer } from "electron"

export const uploadAPI = {
  uploadFolder: (
    localSaveFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("upload-folder", localSaveFolderPath, r2DestinationPath)
}
