import { ipcRenderer } from "electron"

export const uploadAPI = {
  uploadFolder: (
    localsaveFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("upload-folder", localsaveFolderPath, r2DestinationPath)
}
