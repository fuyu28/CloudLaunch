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

import type { FilterOption, SortOption } from "src/types/menu"

type GameSearchFilterProps = {
  /** 検索ワード */
  searchWord: string
  /** ソートオプション */
  sort: SortOption
  /** フィルタオプション */
  filter: FilterOption
  /** 検索ワード変更ハンドラ */
  onSearchWordChange: (value: string) => void
  /** ソート変更ハンドラ */
  onSortChange: (value: SortOption) => void
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
  filter,
  onSearchWordChange,
  onSortChange,
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pt-1">
      {/* 検索フィールド */}
      <label htmlFor="game-search" className="input w-70 left-6 flex items-center">
        <CiSearch />
        <input
          id="game-search"
          type="search"
          className="glow ml-2"
          placeholder="検索"
          value={searchWord}
          onChange={handleSearchChange}
        />
      </label>

      {/* フィルタ・ソート */}
      <div className="flex items-center gap-3 px-6">
        <span className="text-sm leading-tight">ソート順 :</span>
        <select
          value={sort}
          onChange={handleSortChange}
          className="select select-bordered text-sm w-40 h-9"
        >
          <option value="title">タイトル順</option>
          <option value="lastPlayed">最近プレイした順</option>
          <option value="lastRegistered">最近登録した順</option>
          <option value="totalPlayTime">プレイ時間が長い順</option>
          <option value="publisher">ブランド順</option>
        </select>

        <span className="text-sm leading-tight">プレイ状況 :</span>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="select select-bordered text-sm w-30 h-9"
        >
          <option value="all">すべて</option>
          <option value="unplayed">未プレイ</option>
          <option value="playing">プレイ中</option>
          <option value="played">プレイ済み</option>
        </select>
      </div>
    </div>
  )
})

export default GameSearchFilter
