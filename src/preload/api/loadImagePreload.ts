import { ipcRenderer } from "electron"

export const loadImageAPI = {
  loadImage: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke("load-image", filePath)
}
