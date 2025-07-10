import { ipcRenderer } from "electron"

export const windowAPI = {
  minimize: (): Promise<void> => ipcRenderer.invoke("minimize-window"),
  toggleMaximize: (): Promise<void> => ipcRenderer.invoke("toggle-maximize-window"),
  close: (): Promise<void> => ipcRenderer.invoke("close-window"),
  openFolder: (folderPath: string): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke("open-folder", folderPath)
}
