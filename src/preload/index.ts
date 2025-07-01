import { contextBridge } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

// Custom APIs for renderer
import { fileDialogAPI } from "./api/fileDialogPreload"
import { saveDataUploadAPI } from "./api/saveDataUploadPreload"
import { saveDataFolderAPI } from "./api/saveDataFolderPreload"
import { saveDataDownloadAPI } from "./api/saveDataDownloadPreload"
import { credentialAPI } from "./api/credentialPreload"
import { databaseAPI } from "./api/databasePreload"
import { loadImageAPI } from "./api/loadImagePreload"

const api = {
  fileDialog: fileDialogAPI,
  saveData: {
    upload: saveDataUploadAPI,
    download: saveDataDownloadAPI,
    listFolders: saveDataFolderAPI
  },
  credential: credentialAPI,
  database: databaseAPI,
  loadImage: loadImageAPI
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
