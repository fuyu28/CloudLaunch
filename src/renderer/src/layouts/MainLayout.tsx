import React, { useState } from "react"
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom"
import { IoIosHome, IoIosSettings, IoIosArrowBack } from "react-icons/io"
import type { sortName, filterName } from "src/types/menu"

export default function MainLayout(): React.ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === "/"
  const isSettings = location.pathname === "/settings"

  // Home ページでだけ使う sort/filter state
  const [sort, setSort] = useState<sortName>("title")
  const [filter, setFilter] = useState<filterName>("all")

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between p-4 bg-base-100 shadow">
        <div className="flex items-center space-x-2">
          {/* Home 以外なら戻るボタン */}
          {!(isHome || isSettings) && (
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle p-2">
              <IoIosArrowBack size={20} />
            </button>
          )}

          {/* 共通のナビアイコン */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `btn btn-ghost btn-circle p-2 ${isActive ? "text-primary" : ""}`
            }
          >
            <IoIosHome size={20} />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `btn btn-ghost btn-circle p-2 ${isActive ? "text-primary" : ""}`
            }
          >
            <IoIosSettings size={20} />
          </NavLink>
        </div>

        {/* Home だけに出る select フィルタ */}
        {isHome && (
          <div className="flex space-x-4">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as sortName)}
              className="select select-bordered w-48"
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
              className="select select-bordered w-32"
            >
              <option value="all">すべて</option>
              <option value="unplayed">未プレイ</option>
              <option value="playing">プレイ中</option>
              <option value="played">プレイ済み</option>
            </select>
          </div>
        )}
      </header>

      {/* 各ページの中身 */}
      <main className="flex-1 p-6">
        <Outlet context={{ sort, filter }} />
      </main>
    </div>
  )
}
