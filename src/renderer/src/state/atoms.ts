import { atom } from "jotai"
import type { FilterName, SortName } from "src/types/menu"
import { Game } from "@prisma/client"
import { Creds } from "src/types/creds"
import { InputGameData } from "src/types/game"

// クレデンシャル系

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

// Home.tsx

// 検索ワード
export const searchWordAtom = atom<string>("")

// フィルター
export const filterAtom = atom<FilterName>("all")

// ソート
export const sortAtom = atom<SortName>("title")

// 可視ゲーム一覧
export const visibleGamesAtom = atom<Game[]>([])

// Homeのエラーメッセージ
export const homeErrorAtom = atom<string | null>(null)

// Homeのモーダル開閉フラグ
export const isModalOpenAtom = atom<boolean>(false)

// Settings.tsx

// バケット名
export const bucketNameAtom = atom<string>("")

// エンドポイント
export const endpointAtom = atom<string>("")

// リージョン名
export const regionAtom = atom<string>("")

// アクセスキーID
export const accessKeyIdAtom = atom<string>("")

// シークレットアクセスキー
export const secretAccessKeyAtom = atom<string>("")

// トーストフラグ
export const toastAtom = atom<{ message: string; type: "success" | "error" } | null>(null)

// AddGameModal.tsx

// 入力するゲームの情報
export const gameFormValuesAtom = atom<InputGameData>({
  title: "",
  publisher: "",
  saveFolderPath: "",
  exePath: "",
  imagePath: "",
  playStatus: "unplayed"
})

// AddGameModalのエラーメッセージ
export const addGameModalErrorAtom = atom<string | null>(null)

// 登録中のフラグ
export const submittingAtom = atom(false)

// ちゃんとフォームが埋められているかのフラグ
export const canSubmitAtom = atom(false)
