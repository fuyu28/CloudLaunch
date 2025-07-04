import type { API } from "../../../../preload/preload"

declare global {
  interface Window {
    api: API
  }
}