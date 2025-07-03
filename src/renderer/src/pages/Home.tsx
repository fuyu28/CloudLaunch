import React, { useEffect, useState, useCallback } from "react"
import { useAtom } from "jotai"
import { CiSearch } from "react-icons/ci"
import { IoIosAdd } from "react-icons/io"
import GameCard from "@renderer/components/GameCard"
import GameFormModal from "@renderer/components/GameModal"
import FloatingButton from "@renderer/components/FloatingButton"
import { searchWordAtom, filterAtom, sortAtom, visibleGamesAtom } from "../state/home"
import { useDebounce } from "../hooks/useDebounce"
import { useLoadingState } from "../hooks/useLoadingState"
import type { InputGameData } from "src/types/game"
import type { ApiResult } from "src/types/result"
import type { SortName, FilterName } from "src/types/menu"

export default function Home(): React.ReactElement {
  const [searchWord, setSearchWord] = useAtom(searchWordAtom)
  const [filter, setFilter] = useAtom(filterAtom)
  const [sort, setSort] = useAtom(sortAtom)
  const [visibleGames, setVisibleGames] = useAtom(visibleGamesAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 検索語をデバウンス（300ms遅延）
  const debouncedSearchWord = useDebounce(searchWord, 300)

  // ローディング状態管理
  const gameListLoading = useLoadingState()
  const gameActionLoading = useLoadingState()

  useEffect(() => {
    let cancelled = false

    const fetchGames = async (): Promise<void> => {
      const games = await gameListLoading.executeWithLoading(
        () => window.api.database.listGames(debouncedSearchWord, filter, sort),
        {
          errorMessage: "ゲーム一覧の取得に失敗しました",
          showToast: true
        }
      )

      if (!cancelled && games) {
        setVisibleGames(games)
      }
    }

    fetchGames()
    return () => {
      cancelled = true
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchWord, filter, sort])

  const handleAddGame = async (values: InputGameData): Promise<ApiResult<void>> => {
    const result = await gameActionLoading.executeWithLoading(
      async () => {
        const createResult = await window.api.database.createGame(values)
        if (!createResult.success) {
          throw new Error(createResult.message)
        }

        // ゲーム一覧を再取得
        const games = await window.api.database.listGames(debouncedSearchWord, filter, sort)
        setVisibleGames(games)
        setIsModalOpen(false)

        return createResult
      },
      {
        loadingMessage: "ゲームを追加しています...",
        successMessage: "ゲームを追加しました",
        showToast: true
      }
    )

    return result || { success: false, message: "ゲームの追加に失敗しました" }
  }

  const handleLaunchGame = useCallback(
    async (exePath: string) => {
      await gameActionLoading.executeWithLoading(
        async () => {
          const result = await window.api.game.launchGame(exePath)
          if (!result.success) {
            throw new Error(result.message)
          }
          return result
        },
        {
          loadingMessage: "ゲームを起動しています...",
          successMessage: "ゲームが起動しました",
          errorMessage: "ゲームの起動に失敗しました",
          showToast: true
        }
      )
    },
    [gameActionLoading]
  )

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* フィルタ領域 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pt-1">
        <label htmlFor="game-search" className="input w-70 left-6 flex items-center">
          <CiSearch />
          <input
            id="game-search"
            type="search"
            className="glow ml-2"
            placeholder="検索"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3 px-6">
          <span className="text-sm leading-tight">ソート順 :</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortName)}
            className="select select-bordered text-sm w-40 h-9"
          >
            <option value="title">タイトル順</option>
            <option value="recentlyPlayed">最近プレイした順</option>
            <option value="longestPlayed">プレイ時間が長い順</option>
            <option value="recentlyRegistered">最近登録した順</option>
          </select>
          <span className="text-sm leading-tight">プレイ状況 :</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterName)}
            className="select select-bordered text-sm w-30 h-9"
          >
            <option value="all">すべて</option>
            <option value="unplayed">未プレイ</option>
            <option value="playing">プレイ中</option>
            <option value="played">プレイ済み</option>
          </select>
        </div>
      </div>

      {/* エラー */}

      {/* ゲーム一覧 */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent min-h-0">
        <div className="relative">
          <div
            className="grid gap-4 justify-center px-6 pb-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, 220px)" }}
          >
            {visibleGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                publisher={game.publisher}
                imagePath={game.imagePath ?? ""}
                exePath={game.exePath}
                onLaunchGame={handleLaunchGame}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ゲーム追加ボタン */}
      <FloatingButton
        onClick={() => setIsModalOpen(true)}
        ariaLabel="ゲームを追加"
        positionClass="bottom-6 right-6"
      >
        <IoIosAdd size={28} />
      </FloatingButton>

      {/* ゲーム登録モーダル */}
      <GameFormModal
        mode="add"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddGame}
      />
    </div>
  )
}
