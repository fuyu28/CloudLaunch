import { ipcRenderer } from "electron"

export const fileDialogAPI = {
  selectAppExe: (): Promise<string | null> => ipcRenderer.invoke("select-app-exe"),
  selectSaveDataFolder: (): Promise<string | null> => ipcRenderer.invoke("select-save-data-folder")
}
