import { ipcRenderer } from "electron"

export const saveDataFolderAPI = {
  listRemoteSaveDataFolders: (): Promise<string[] | null> =>
    ipcRenderer.invoke("list-remote-save-data-folders")
}
