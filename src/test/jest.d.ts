/**
 * @fileoverview Jest用の型定義
 *
 * Jestテスト実行時に必要な型定義を提供します。
 */

import type { API } from "../preload/preload.d"

declare global {
  interface Window {
    api: API
  }

  interface ImportMeta {
    env: {
      DEV: boolean
    }
  }
}

export {}
