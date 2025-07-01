import { contextBridge } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

// Custom APIs for renderer
import { fileDialogAPI } from "./api/fileDialogPreload"
import { uploadAPI } from "./api/uploadPreload"
import { getR2FolderListAPI } from "./api/r2ListPreload"
import { downloadAPI } from "./api/downloadPreload"
import { credentialAPI } from "./api/credentialPreload"
import { databaseAPI } from "./api/databasePreload"

const api = {
  fileDialog: fileDialogAPI,
  upload: uploadAPI,
  getR2FolderList: getR2FolderListAPI,
  download: downloadAPI,
  credential: credentialAPI,
  database: databaseAPI
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
