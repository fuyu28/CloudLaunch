import { ipcRenderer } from "electron"

export const saveDataFolderAPI = {
  listRemoteSaveDataFolders: (): Promise<string[] | undefined> =>
    ipcRenderer.invoke("list-remote-save-data-folders")
}
