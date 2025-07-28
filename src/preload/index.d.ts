import type { API } from "./preload"
import type { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
