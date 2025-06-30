// src/pages/Home.tsx
import React, { useState, useMemo } from "react"
import { CiSearch } from "react-icons/ci"
import { IoIosAdd } from "react-icons/io"
import type { SortName, FilterName } from "src/types/menu"
import type { GameType } from "src/types/game"
import GameCard from "@renderer/components/GameCard"

const sampleGames: GameType[] = [
  {
    id: "1",
    title: "サクラノ刻 -櫻の森の下を歩む-",
    publisher: "枕",
    coverUrl: "/assets/covers/1.jpg"
  },
  {
    id: "2",
    title: "WHITE ALBUM2 EXTENDED EDITION",
    publisher: "Leaf",
    coverUrl: "/assets/covers/2.jpg"
  },
  {
    id: "3",
    title: "Summer Pockets REFLECTION BLUE",
    publisher: "Key",
    coverUrl: "/assets/covers/3.jpg"
  },
  {
    id: "4",
    title: "ATRI -My Dear Moments-",
    publisher: "ANIPLEX.EXE",
    coverUrl: "/assets/covers/4.jpg"
  },
  { id: "5", title: "STEINS;GATE 0", publisher: "ホビボックス", coverUrl: "/assets/covers/5.jpg" },
  {
    id: "6",
    title: "グリムガーデンの少女 -witch in gleamgarden",
    publisher: "COSMIC CUTE",
    coverUrl: "/assets/covers/6.jpg"
  }
]

export default function Home(): React.ReactElement {
  const [sort, setSort] = useState<SortName>("title")
  const [filter, setFilter] = useState<FilterName>("all")

  const visibleGames = useMemo(() => {
    return sampleGames
      .filter((g) => {
        if (filter === "all") return true
        // filter が "unplayed"/"playing"/"played" の判定を追加
        return true
      })
      .sort((a, b) => {
        switch (sort) {
          case "title":
            return a.title.localeCompare(b.title)
          case "recentlyPlayed":
            return b.id.localeCompare(a.id)
          case "longestPlayed":
          case "recentlyRegistered":
          default:
            return 0
        }
      })
  }, [sort, filter])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Home 固有のフィルタ */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pt-1">
        <label htmlFor="game-search" className="input w-70 left-6">
          <CiSearch />
          <input id="game-search" type="search" className="glow" placeholder="検索" />
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
            <option value="newestRelease">発売日が新しい順</option>
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

      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent min-h-0 right-0">
        {/* ゲーム一覧グリッド */}
        <div
          className="grid gap-4 justify-center px-6 pb-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, 220px)" }}
        >
          {visibleGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>

      {/* ゲーム追加ボタン */}
      <button
        className="
          btn btn-primary btn-circle
          fixed bottom-6 right-6 shadow-lg
          h-14 w-14 flex items-center justify-center
        "
        aria-label="ゲームを追加"
      >
        <IoIosAdd size={28} />
      </button>
    </div>
  )
}
