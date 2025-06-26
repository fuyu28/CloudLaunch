import { ipcRenderer } from "electron"

export const getR2FolderListAPI = {
  getR2FolderList: (): Promise<string[] | null> => ipcRenderer.invoke("get-r2-folder-list")
}
