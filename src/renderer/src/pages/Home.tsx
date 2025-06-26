// src/pages/Home.tsx
import { useState } from "react"
import { Link } from "react-router-dom"

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
  {
    id: "2",
    title: "2",
    subtitle: "2",
    coverUrl: "/assets/covers/2.jpg"
  },
  {
    id: "3",
    title: "3",
    subtitle: "3",
    coverUrl: "/assets/covers/3.jpg"
  },
  {
    id: "4",
    title: "4",
    subtitle: "4",
    coverUrl: "/assets/covers/4.jpg"
  },
  {
    id: "5",
    title: "5",
    subtitle: "5",
    coverUrl: "/assets/covers/5.jpg"
  },
  {
    id: "6",
    title: "6",
    subtitle: "6",
    coverUrl: "/assets/covers/6.jpg"
  }
]

type sortName =
  | "title"
  | "recentlyPlayed"
  | "longestPlayTime"
  | "newestRelease"
  | "recentlyRegistered"
  | "brandAsc"

type filterName = "all" | "unplayed" | "playing" | "played"

export default function Home(): React.JSX.Element {
  const [sort, setSort] = useState<sortName>("title")
  const [filter, setFilter] = useState<filterName>("all")

  return (
    <div className="min-h-screen bg-base-200 p-6">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <button className="btn btn-primary">＋ ゲームを登録</button>
        <div className="flex space-x-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as sortName)}
            className="select select-bordered w-50"
          >
            <option value="title">タイトル順</option>
            <option value="recentlyPlayed">最近プレイした順</option>
            <option value="longestPlayed">プレイ時間が長い順</option>
            <option value="newestRelease">発売日が新しい順</option>
            <option value="recentlyRegistered">最近登録した順</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as filterName)}
            className="select select-bordered"
          >
            <option value="all">すべて</option>
            <option value="unplayed">未プレイ</option>
            <option value="playing">プレイ中</option>
            <option value="played">プレイ済み</option>
          </select>
        </div>
      </div>

      {/* グリッド */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sampleGames.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="card card-compact bg-base-100 shadow hover:shadow-lg transition"
          >
            <figure>
              <img src={game.coverUrl} alt={game.title} className="h-40 w-full object-cover" />
            </figure>
            <div className="card-body p-4">
              <h3 className="card-title text-lg truncate">{game.title}</h3>
              <p className="text-sm text-gray-500 truncate">{game.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
