import { ipcRenderer } from "electron"

export const fileDialogAPI = {
  selectExe: (): Promise<string | null> => ipcRenderer.invoke("select-exe"),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke("select-folder")
}
