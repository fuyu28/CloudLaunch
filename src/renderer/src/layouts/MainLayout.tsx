import React, { useRef } from "react"
import { Outlet, NavLink, useLocation } from "react-router-dom"
import { FiMenu } from "react-icons/fi"
import { IoIosHome, IoIosSettings } from "react-icons/io"
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from "react-icons/vsc"
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
          pt-10 pb-2 px-2
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
        {/* ↓ ここをカスタムタイトルバーに */}
        <header
          className="
          relative
          flex items-center
          h-10 bg-base-100 shadow
          select-none
          [-webkit-app-region:drag]
        "
        >
          {/* ドロワー開閉ボタンは no-drag */}
          <label
            htmlFor="main-drawer"
            className="
              absolute inset-y-0 left-0
              flex items-center justify-center
              h-full w-10
              btn btn-ghost p-0 focus:outline-none
              hover:bg-neutral/80 dark:hover:bg-neutral-focus
              [-webkit-app-region:no-drag]
            "
          >
            <FiMenu size={22} />
          </label>

          {/* 中央タイトルもドラッグ可能 */}
          <h1 className="flex-1 text-center text-lg font-medium leading-none">
            {isHome ? "ホーム" : isSettings ? "設定" : ""}
          </h1>

          {/* ウィンドウ操作ボタン群 */}
          <div className="absolute inset-y-0 right-0 flex [-webkit-app-region:no-drag]">
            <button
              onClick={() => window.api.window.minimize()}
              className="h-10 w-10 flex items-center justify-center hover:bg-gray-300/80 dark:hover:bg-neutral-focus"
            >
              {/* <FaRegWindowMinimize /> */}
              <VscChromeMinimize />
            </button>
            <button
              onClick={() => window.api.window.toggleMaximize()}
              className="h-10 w-10 flex items-center justify-center hover:bg-gray-300/80 dark:hover:bg-neutral-focus"
            >
              {/* <FaRegWindowMaximize /> */}
              <VscChromeMaximize />
            </button>
            <button
              onClick={() => window.api.window.close()}
              className="h-10 w-10 flex items-center justify-center hover:bg-red-500/90 hover:text-white"
            >
              {/* <FaRegWindowClose /> */}
              <VscChromeClose />
            </button>
          </div>
        </header>

        {/* ページ固有部分 */}
        <main className="flex-1 pt-4 overflow-hidden min-h-0">
          <Outlet />
        </main>
      </div>

      <Toaster position="bottom-center" />
    </div>
  )
}
