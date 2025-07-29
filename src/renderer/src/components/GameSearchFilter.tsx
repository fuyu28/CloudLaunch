/**
 * @fileoverview ゲーム検索・フィルタコンポーネント
 *
 * このコンポーネントは、ゲーム一覧の検索とフィルタリング機能を提供します。
 * 主な機能：
 * - 検索入力フィールド
 * - ソート選択ドロップダウン
 * - プレイ状況フィルタドロップダウン
 * - メモ化による最適化
 */

import { memo, useCallback } from "react"
import { CiSearch } from "react-icons/ci"
import { IoFilterOutline } from "react-icons/io5"
import { TbSortAscending, TbSortDescending } from "react-icons/tb"

import type { FilterOption, SortOption, SortDirection } from "src/types/menu"

type GameSearchFilterProps = {
  /** 検索ワード */
  searchWord: string
  /** ソートオプション */
  sort: SortOption
  /** ソート方向 */
  sortDirection: SortDirection
  /** フィルタオプション */
  filter: FilterOption
  /** 検索ワード変更ハンドラ */
  onSearchWordChange: (value: string) => void
  /** ソート変更ハンドラ */
  onSortChange: (value: SortOption) => void
  /** ソート方向変更ハンドラ */
  onSortDirectionChange: (value: SortDirection) => void
  /** フィルタ変更ハンドラ */
  onFilterChange: (value: FilterOption) => void
}

/**
 * ゲーム検索・フィルタコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns 検索・フィルタ要素
 */
const GameSearchFilter = memo(function GameSearchFilter({
  searchWord,
  sort,
  sortDirection,
  filter,
  onSearchWordChange,
  onSortChange,
  onSortDirectionChange,
  onFilterChange
}: GameSearchFilterProps): React.JSX.Element {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchWordChange(e.target.value)
    },
    [onSearchWordChange]
  )

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange(e.target.value as SortOption)
    },
    [onSortChange]
  )

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange(e.target.value as FilterOption)
    },
    [onFilterChange]
  )

  const handleSortDirectionToggle = useCallback(() => {
    onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
  }, [sortDirection, onSortDirectionChange])

  return (
    <div className="bg-base-200 p-4 rounded-lg mb-4">
      {/* 検索バー */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <label htmlFor="game-search" className="input input-bordered flex items-center gap-2">
            <CiSearch className="w-4 h-4 opacity-70" />
            <input
              id="game-search"
              type="search"
              className="grow"
              placeholder="ゲームタイトルやブランド名で検索..."
              value={searchWord}
              onChange={handleSearchChange}
            />
          </label>
        </div>

        {/* コントロール群 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* ソート設定 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium opacity-70">並び順</label>
            <select
              value={sort}
              onChange={handleSortChange}
              className="select select-bordered select-sm w-auto min-w-32"
              aria-label="ソート順を選択"
            >
              <option value="title">タイトル順</option>
              <option value="lastPlayed">最近プレイ順</option>
              <option value="lastRegistered">登録順</option>
              <option value="totalPlayTime">プレイ時間順</option>
              <option value="publisher">ブランド順</option>
            </select>
            <button
              type="button"
              onClick={handleSortDirectionToggle}
              className="btn btn-ghost btn-sm btn-circle"
              title={sortDirection === "asc" ? "昇順（A→Z, 古→新）" : "降順（Z→A, 新→古）"}
              aria-label={`${sortDirection === "asc" ? "昇順" : "降順"}で表示中。クリックで切り替え`}
            >
              {sortDirection === "asc" ? (
                <TbSortAscending className="w-4 h-4" />
              ) : (
                <TbSortDescending className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* フィルター設定 */}
          <div className="flex items-center gap-2">
            <IoFilterOutline className="w-4 h-4 opacity-70" />
            <select
              value={filter}
              onChange={handleFilterChange}
              className="select select-bordered select-sm w-auto"
              aria-label="プレイ状況でフィルター"
            >
              <option value="all">すべて</option>
              <option value="unplayed">未プレイ</option>
              <option value="playing">プレイ中</option>
              <option value="played">プレイ済み</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GameSearchFilter
