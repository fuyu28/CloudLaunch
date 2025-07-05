import { atom } from "jotai"
import { Game } from "@prisma/client"
import type { FilterOption, SortOption } from "src/types/menu"

// 検索ワード
export const searchWordAtom = atom<string>("")

// フィルター
export const filterAtom = atom<FilterOption>("all")

// ソート
export const sortAtom = atom<SortOption>("title")

// 可視ゲーム一覧
export const visibleGamesAtom = atom<Game[]>([])
