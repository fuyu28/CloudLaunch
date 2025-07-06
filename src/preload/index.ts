import { contextBridge } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

// Custom APIs for renderer
import { fileAPI } from "./api/filePreload"
import { saveDataUploadAPI } from "./api/saveDataUploadPreload"
import { saveDataFolderAPI } from "./api/saveDataFolderPreload"
import { saveDataDownloadAPI } from "./api/saveDataDownloadPreload"
import { credentialAPI } from "./api/credentialPreload"
import { databaseAPI } from "./api/databasePreload"
import { loadImageAPI } from "./api/loadImagePreload"
import { launchGameAPI } from "./api/launchGamePreload"
import { windowAPI } from "./api/windowPreload"

const api = {
  window: windowAPI,
  file: fileAPI,
  saveData: {
    upload: saveDataUploadAPI,
    download: saveDataDownloadAPI,
    listFolders: saveDataFolderAPI
  },
  credential: credentialAPI,
  database: databaseAPI,
  loadImage: loadImageAPI,
  game: launchGameAPI
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
