import { ElectronAPI } from "@electron-toolkit/preload"
import type { API } from "./preload"

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
