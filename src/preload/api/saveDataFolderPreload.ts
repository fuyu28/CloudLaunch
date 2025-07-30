import { ipcRenderer } from "electron"

export const saveDataFolderAPI = {
  listRemoteSaveDataFolders: (): Promise<string[] | undefined> =>
    ipcRenderer.invoke("cloud:listRemoteFolders")
}
