import { atom } from "jotai"
import type { GameType } from "src/types/game"
import type { FilterOption, SortOption } from "src/types/menu"
import { defaultSortOptionAtom, defaultFilterStateAtom } from "./settings"

// 検索ワード
export const searchWordAtom = atom<string>("")

// 内部状態atom（実際の値を保持）
const _filterAtom = atom<FilterOption | null>(null)
const _sortAtom = atom<SortOption | null>(null)

// フィルター（デフォルト設定から初期値を取得）
export const filterAtom = atom(
  (get) => get(_filterAtom) ?? get(defaultFilterStateAtom),
  (_, set, newValue: FilterOption) => {
    set(_filterAtom, newValue)
  }
)

// ソート（デフォルト設定から初期値を取得）
export const sortAtom = atom(
  (get) => get(_sortAtom) ?? get(defaultSortOptionAtom),
  (_, set, newValue: SortOption) => {
    set(_sortAtom, newValue)
  }
)

// 可視ゲーム一覧
export const visibleGamesAtom = atom<GameType[]>([])

// 現在選択中のゲームID
export const currentGameIdAtom = atom<string | null>(null)

// 現在選択中のゲームを取得する派生atom
export const currentGameAtom = atom<GameType | null>((get) => {
  const gameId = get(currentGameIdAtom)
  const games = get(visibleGamesAtom)
  return gameId ? games.find((g) => g.id === gameId) || null : null
})
