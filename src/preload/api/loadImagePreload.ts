import { ipcRenderer } from "electron"

export const loadImageAPI = {
  loadImageFromLocal: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke("load-image-from-local", filePath),
  loadImageFromWeb: (url: string): Promise<string | null> =>
    ipcRenderer.invoke("load-image-from-web", url)
}
