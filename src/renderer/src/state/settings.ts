import { atom } from "jotai"

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
