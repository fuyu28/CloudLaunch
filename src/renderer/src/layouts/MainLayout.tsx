import React, { useRef } from "react"
import { Outlet, NavLink, useLocation } from "react-router-dom"
import { FiMenu } from "react-icons/fi"
import { IoIosHome, IoIosSettings } from "react-icons/io"
import { Toaster } from "react-hot-toast"

export default function MainLayout(): React.JSX.Element {
  const location = useLocation()
  const drawerRef = useRef<HTMLInputElement>(null)
  const isHome = location.pathname === "/"
  const isSettings = location.pathname === "/settings"

  const closeDrawer = (): void => {
    if (drawerRef.current) drawerRef.current.checked = false
  }

  return (
    <div className="drawer drawer-mobile min-h-screen bg-base-200">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" ref={drawerRef} />

      {/* サイドバー */}
      <div className="drawer-side">
        <label htmlFor="main-drawer" className="drawer-overlay bg-[rgba(0,0,0,0.15)] z-40" />

        <aside
          className="
          fixed left-0 z-50
          h-full w-56
          bg-base-100
          border-r border-base-200
          pt-14 pb-2 px-2
          rounded-tr-lg rounded-br-lg
          shadow-lg
          transform transition-transform duration-200 ease-out
        "
        >
          <div className="flex flex-col h-full">
            {/* 上部メニュー */}
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center w-full p-3 rounded-md ${
                      isActive
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-300 dark:hover:bg-base-700"
                    }`
                  }
                  onClick={closeDrawer}
                >
                  <IoIosHome className="mr-2 text-lg" />
                  <span className="flex-1">ホーム</span>
                </NavLink>
              </li>
            </ul>

            {/* 下部メニューは mt-auto で下端へ */}
            <ul className="space-y-2 mt-auto">
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center w-full p-3 rounded-md ${
                      isActive
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-300 dark:hover:bg-base-700"
                    }`
                  }
                  onClick={closeDrawer}
                >
                  <IoIosSettings className="mr-2 text-lg" />
                  <span className="flex-1">設定</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* メイン */}
      <div className="drawer-content flex flex-col h-screen">
        <header className="flex items-center justify-between h-14 px-6 bg-base-100 shadow">
          <label htmlFor="main-drawer" className="btn btn-ghost h-9 w-9 p-0 focus:outline-none">
            <FiMenu size={24} />
          </label>
          <h1 className="flex-1 text-center text-lg font-medium leading-none">
            {isHome ? "ホーム" : isSettings ? "設定" : ""}
          </h1>
        </header>

        {/* ページ固有部分をここに描画 */}
        <main className="flex-1 pt-4 overflow-hidden min-h-0">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-center" />
    </div>
  )
}
