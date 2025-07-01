import React, { useState, useEffect } from "react"
import type { Game } from "@prisma/client"
import { CiSearch } from "react-icons/ci"
import { IoIosAdd } from "react-icons/io"
import type { SortName, FilterName } from "src/types/menu"
import GameCard from "@renderer/components/GameCard"
import GameFormModal from "@renderer/components/AddGameModal"
import { InputGameData } from "src/types/game"

export default function Home(): React.ReactElement {
  const [searchWord, setSearchWord] = useState<string>("")
  const [filter, setFilter] = useState<FilterName>("all")
  const [sort, setSort] = useState<SortName>("title")
  const [visibleGames, setVisibleGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    async function fetchGames(): Promise<void> {
      setError(null)
      try {
        const games = await window.api.database.listGames(searchWord, filter, sort)
        if (!cancelled) {
          setVisibleGames(games)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "ゲーム一覧の取得に失敗しました")
        }
      }
    }
    fetchGames()
    return () => {
      cancelled = true
    }
  }, [searchWord, filter, sort])

  const handleOpenModal = (): void => setIsModalOpen(true)
  const handleCloseModal = (): void => setIsModalOpen(false)

  const handleAddGame = async (values: InputGameData): Promise<void> => {
    const result = await window.api.database.createGame(values)
    if (result.success) {
      const games = await window.api.database.listGames(searchWord, filter, sort)
      setVisibleGames(games)
      handleCloseModal()
    } else {
      setError(result.message ?? "ゲームの追加に失敗しました")
    }
  }

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
      {error && <p className="p-4 text-red-500">{error}</p>}

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
              />
            ))}
          </div>
        </div>
      </div>

      {/* ゲーム追加ボタン */}
      <button
        className="btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg h-14 w-14 flex items-center justify-center"
        aria-label="ゲームを追加"
        onClick={handleOpenModal}
      >
        <IoIosAdd size={28} />
      </button>

      {/* ゲーム登録モーダル */}
      <GameFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleAddGame} />
    </div>
  )
}
