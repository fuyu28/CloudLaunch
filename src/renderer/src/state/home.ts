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

// 現在選択中のゲームID
export const currentGameIdAtom = atom<string | null>(null)

// 現在選択中のゲームを取得する派生atom
export const currentGameAtom = atom<Game | null>((get) => {
  const gameId = get(currentGameIdAtom)
  const games = get(visibleGamesAtom)
  return gameId ? games.find((g) => g.id === gameId) || null : null
})
