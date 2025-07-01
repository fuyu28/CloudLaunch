import { atom } from "jotai"
import type { Creds } from "src/types/creds"

// クレデンシャル
export const credsAtom = atom<Creds | null>(null)

// 有効なクレデンシャルが設定されているかのフラグ
export const isValidCredsAtom = atom(false)

// 有効かを再判定する
export const reloadCredsAtom = atom(null, async (_get, set) => {
  try {
    const stored = await window.api.credential.getCredential()
    if (stored) {
      const { success } = await window.api.credential.testCredential(stored)
      set(credsAtom, success ? stored : null)
      set(isValidCredsAtom, success)
    } else {
      set(credsAtom, null)
      set(isValidCredsAtom, false)
    }
  } catch {
    set(credsAtom, null)
    set(isValidCredsAtom, false)
  }
})
