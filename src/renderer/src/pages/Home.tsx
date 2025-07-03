import React, { useEffect, useState, useCallback } from "react"
import { useAtom } from "jotai"
import { CiSearch } from "react-icons/ci"
import { IoIosAdd } from "react-icons/io"
import GameCard from "@renderer/components/GameCard"
import GameFormModal from "@renderer/components/GameModal"
import { searchWordAtom, filterAtom, sortAtom, visibleGamesAtom } from "../state/home"
import type { InputGameData } from "src/types/game"
import type { ApiResult } from "src/types/result"
import type { SortName, FilterName } from "src/types/menu"
import toast from "react-hot-toast"

export default function Home(): React.ReactElement {
  const [searchWord, setSearchWord] = useAtom(searchWordAtom)
  const [filter, setFilter] = useAtom(filterAtom)
  const [sort, setSort] = useAtom(sortAtom)
  const [visibleGames, setVisibleGames] = useAtom(visibleGamesAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchGames(): Promise<void> {
      try {
        const games = await window.api.database.listGames(searchWord, filter, sort)
        if (!cancelled) {
          setVisibleGames(games)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e.message ?? "ゲーム一覧の取得に失敗しました")
        }
      }
    }
    fetchGames()
    return () => {
      cancelled = true
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchWord, filter, sort])

  const handleAddGame = async (values: InputGameData): Promise<ApiResult<void>> => {
    const result = await window.api.database.createGame(values)
    if (result.success) {
      toast.success("ゲームを追加しました。")
      const games = await window.api.database.listGames(searchWord, filter, sort)
      setVisibleGames(games)
      setIsModalOpen(false)
    } else {
      toast.error(result.message)
    }
    return result
  }

  const handleLaunchGame = useCallback(async (exePath: string) => {
    const loadingToastId = toast.loading("ゲームを起動しています…")
    try {
      const result = await window.api.game.launchGame(exePath)
      if (result.success) {
        toast.success("ゲームが起動しました", { id: loadingToastId })
      } else {
        toast.error(result.message, { id: loadingToastId })
      }
    } catch (error) {
      toast.error("ゲームの起動に失敗しました", { id: loadingToastId })
      console.error("Failed to launch game:", error)
    }
  }, [])

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
      <button
        className="
          btn btn-primary btn-circle
          fixed bottom-6 right-6
          h-14 w-14
          flex items-center justify-center
          shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]
          rounded-full
          active:scale-95
          transition-all duration-200 ease-out
        "
        aria-label="ゲームを追加"
        onClick={() => setIsModalOpen(true)}
      >
        <IoIosAdd size={28} />
      </button>

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
