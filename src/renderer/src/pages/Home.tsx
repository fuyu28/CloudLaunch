// src/pages/Home.tsx
import React, { useState } from "react"
import { Link } from "react-router-dom"
import { IoIosAdd, IoIosPlay } from "react-icons/io"
import type { sortName, filterName } from "src/types/menu"

type Game = {
  id: string
  title: string
  subtitle: string
  coverUrl: string
}

const sampleGames: Game[] = [
  {
    id: "1",
    title: "サクラノ刻 -櫻の森の下を歩む-",
    subtitle: "枕",
    coverUrl: "/assets/covers/1.jpg"
  },
  { id: "2", title: "2", subtitle: "2", coverUrl: "/assets/covers/2.jpg" },
  { id: "3", title: "3", subtitle: "3", coverUrl: "/assets/covers/3.jpg" },
  { id: "4", title: "4", subtitle: "4", coverUrl: "/assets/covers/4.jpg" },
  { id: "5", title: "5", subtitle: "5", coverUrl: "/assets/covers/5.jpg" },
  { id: "6", title: "6", subtitle: "6", coverUrl: "/assets/covers/6.jpg" }
]

export default function Home(): React.ReactElement {
  const [sort, setSort] = useState<sortName>("title")
  const [filter, setFilter] = useState<filterName>("all")

  const visibleGames = sampleGames
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
          return b.id.localeCompare(a.id) // ダミーデータ
        case "longestPlayed":
        case "newestRelease":
        case "recentlyRegistered":
        default:
          return 0
      }
    })

  return (
    <div className="flex flex-col h-full">
      {/* フィルタ＋グリッドをまとめてスクロール */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
        {/* Home 固有のフィルタ */}
        <div className="flex flex-wrap items-center gap-4 mb-6 px-6 pt-6">
          <span className="text-sm leading-tight">ソート順:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as sortName)}
            className="select select-bordered text-sm"
          >
            <option value="title">タイトル順</option>
            <option value="recentlyPlayed">最近プレイした順</option>
            <option value="longestPlayed">プレイ時間が長い順</option>
            <option value="newestRelease">発売日が新しい順</option>
            <option value="recentlyRegistered">最近登録した順</option>
          </select>
          <span className="text-sm leading-tight">フィルター:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as filterName)}
            className="select select-bordered text-sm"
          >
            <option value="all">すべて</option>
            <option value="unplayed">未プレイ</option>
            <option value="playing">プレイ中</option>
            <option value="played">プレイ済み</option>
          </select>
        </div>

        {/* ゲーム一覧グリッド */}
        <div
          className="grid gap-6 justify-center px-6 pb-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, 220px)" }}
        >
          {visibleGames.map((game) => (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className="
                bg-base-100 rounded-xl overflow-hidden
                shadow-lg transform transition
                hover:scale-105 hover:shadow-2xl
              "
            >
              <div className="relative h-40 w-full">
                <img src={game.coverUrl} alt={game.title} className="h-full w-full object-cover" />
                <div
                  className="
                  absolute inset-0 bg-black bg-opacity-30
                  flex items-center justify-center
                  opacity-0 hover:opacity-100 transition
                "
                >
                  <IoIosPlay size={40} className="text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold truncate">{game.title}</h3>
                <p className="text-sm text-gray-500 truncate">{game.subtitle}</p>
              </div>
            </Link>
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
