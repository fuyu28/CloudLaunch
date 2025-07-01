import { atom } from "jotai"
import { Game } from "@prisma/client"
import type { FilterName, SortName } from "src/types/menu"

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
