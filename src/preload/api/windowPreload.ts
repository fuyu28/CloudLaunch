import { ipcRenderer } from "electron"

export const windowAPI = {
  minimize: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: (): Promise<void> => ipcRenderer.invoke("window:toggleMaximize"),
  close: (): Promise<void> => ipcRenderer.invoke("window:close"),
  openFolder: (folderPath: string): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke("open-folder", folderPath)
}
