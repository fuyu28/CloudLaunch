import { electronAPI } from "@electron-toolkit/preload"
import { contextBridge } from "electron"

// Custom APIs for renderer
import { chapterPreload } from "./api/chapterPreload"
import { cloudDataApi } from "./api/cloudDataPreload"
import { credentialAPI } from "./api/credentialPreload"
import { databaseAPI } from "./api/databasePreload"
import { fileAPI } from "./api/filePreload"
import { launchGameAPI } from "./api/launchGamePreload"
import { loadImageAPI } from "./api/loadImagePreload"
import { memoApi } from "./api/memoPreload"
import { processMonitorAPI } from "./api/processMonitorPreload"
import { saveDataDownloadAPI } from "./api/saveDataDownloadPreload"
import { saveDataFolderAPI } from "./api/saveDataFolderPreload"
import { saveDataUploadAPI } from "./api/saveDataUploadPreload"
import { settingsPreloadApi } from "./api/settingsPreload"
import { windowAPI } from "./api/windowPreload"

const api = {
  window: windowAPI,
  file: fileAPI,
  saveData: {
    upload: saveDataUploadAPI,
    download: saveDataDownloadAPI,
    listFolders: saveDataFolderAPI
  },
  cloudData: cloudDataApi,
  credential: credentialAPI,
  database: databaseAPI,
  loadImage: loadImageAPI,
  game: launchGameAPI,
  processMonitor: processMonitorAPI,
  chapter: chapterPreload,
  settings: settingsPreloadApi,
  memo: memoApi
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
