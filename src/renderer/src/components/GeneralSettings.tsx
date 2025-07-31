/**
 * @fileoverview 一般設定コンポーネント
 *
 * アプリケーションの一般的な設定項目を管理するコンポーネントです。
 *
 * 主な機能：
 * - DaisyUIテーマの選択・変更
 * - デフォルトソート順の設定
 * - デフォルトフィルター状態の設定
 * - オフラインモードの設定
 * - 自動ゲーム検出の設定
 * - 設定の永続化
 * - リアルタイムでの変更反映
 *
 * 使用技術：
 * - Jotai atoms（状態管理）
 * - DaisyUI コンポーネント
 */

import { useAtom } from "jotai"
import toast from "react-hot-toast"

import { logger } from "@renderer/utils/logger"

import { DAISYUI_THEMES } from "../constants/themes"
import {
  themeAtom,
  changeThemeAtom,
  isChangingThemeAtom,
  defaultSortOptionAtom,
  defaultFilterStateAtom,
  offlineModeAtom,
  autoTrackingAtom,
  sortOptionLabels,
  filterStateLabels
} from "../state/settings"
import type { SortOption, FilterOption } from "src/types/menu"

/**
 * 一般設定コンポーネント
 *
 * テーマ選択、デフォルトソート順、デフォルトフィルター状態、
 * オフラインモード、自動ゲーム検出など、アプリケーションの一般的な設定を提供します。
 *
 * @returns 一般設定コンポーネント要素
 */
export default function GeneralSettings(): React.JSX.Element {
  const [currentTheme] = useAtom(themeAtom)
  const [isChangingTheme] = useAtom(isChangingThemeAtom)
  const [, changeTheme] = useAtom(changeThemeAtom)
  const [defaultSortOption, setDefaultSortOption] = useAtom(defaultSortOptionAtom)
  const [defaultFilterState, setDefaultFilterState] = useAtom(defaultFilterStateAtom)
  const [offlineMode, setOfflineMode] = useAtom(offlineModeAtom)
  const [autoTracking, setAutoTracking] = useAtom(autoTrackingAtom)

  // ソート変更ハンドラー
  const handleSortChange = (newSortOption: SortOption): void => {
    setDefaultSortOption(newSortOption)
    toast.success(`デフォルトソート順を「${sortOptionLabels[newSortOption]}」に変更しました`)
  }

  // フィルター変更ハンドラー
  const handleFilterChange = (newFilterState: FilterOption): void => {
    setDefaultFilterState(newFilterState)
    toast.success(`デフォルトフィルターを「${filterStateLabels[newFilterState]}」に変更しました`)
  }

  // オフラインモード変更ハンドラー
  const handleOfflineModeChange = (enabled: boolean): void => {
    setOfflineMode(enabled)
    if (enabled) {
      toast.success("オフラインモードを有効にしました")
    } else {
      toast.success("オフラインモードを無効にしました")
    }
  }

  // 自動ゲーム検出変更ハンドラー
  const handleAutoTrackingChange = async (enabled: boolean): Promise<void> => {
    setAutoTracking(enabled)

    // メインプロセスに設定変更を通知
    try {
      const result = await window.api.settings.updateAutoTracking(enabled)
      if (result.success) {
        if (enabled) {
          toast.success("自動ゲーム検出を有効にしました")
        } else {
          toast.success("自動ゲーム検出を無効にしました")
        }
      } else {
        toast.error("設定の更新に失敗しました")
      }
    } catch (error) {
      logger.error("自動ゲーム検出設定の更新エラー:", {
        component: "GeneralSettings",
        function: "unknown",
        data: error
      })
      toast.error("設定の更新に失敗しました")
    }
  }

  // ログフォルダを開くハンドラー
  const handleOpenLogsDirectory = async (): Promise<void> => {
    try {
      const result = await window.api.file.openLogsDirectory()
      if (result.success) {
        toast.success("ログフォルダを開きました")
      } else {
        toast.error(result.message || "ログフォルダを開くことができませんでした")
      }
    } catch (error) {
      logger.error("ログフォルダを開くエラー:", {
        component: "GeneralSettings",
        function: "handleOpenLogsDirectory",
        data: error
      })
      toast.error("ログフォルダを開くことができませんでした")
    }
  }

  return (
    <div className="card bg-base-100 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">一般設定</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 外観設定グループ */}
        <div className="space-y-6">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-lg font-semibold text-primary mb-1">外観設定</h3>
            <p className="text-sm text-base-content/60">アプリケーションの見た目を設定</p>
          </div>

          {/* テーマ選択 */}
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="mb-3">
              <h4 className="font-medium">テーマ</h4>
              <p className="text-sm text-base-content/70">外観テーマを選択</p>
            </div>
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-sm">現在: {currentTheme}</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={currentTheme}
                  onChange={(e) => changeTheme(e.target.value as typeof currentTheme)}
                  disabled={isChangingTheme}
                >
                  {DAISYUI_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
                {isChangingTheme && <span className="loading loading-spinner loading-sm"></span>}
              </div>
            </div>
          </div>
        </div>

        {/* 動作設定グループ */}
        <div className="space-y-6">
          <div className="border-l-4 border-secondary pl-4">
            <h3 className="text-lg font-semibold text-secondary mb-1">動作設定</h3>
            <p className="text-sm text-base-content/60">アプリケーションの動作を設定</p>
          </div>

          {/* オフラインモード & 自動計測 */}
          <div className="bg-base-200 p-4 rounded-lg space-y-4">
            <div>
              <h4 className="font-medium mb-3">機能設定</h4>

              {/* オフラインモード */}
              <div className="form-control mb-4">
                <label className="label cursor-pointer justify-start p-0">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary mr-3"
                    checked={offlineMode}
                    onChange={(e) => handleOfflineModeChange(e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">オフラインモード</span>
                    <p className="text-xs text-base-content/50 mt-1">
                      {offlineMode ? "クラウド機能が無効" : "すべての機能が利用可能"}
                    </p>
                  </div>
                </label>
              </div>

              {/* 自動ゲーム検出 */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start p-0">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary mr-3"
                    checked={autoTracking}
                    onChange={(e) => handleAutoTrackingChange(e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">自動ゲーム検出</span>
                    <p className="text-xs text-base-content/50 mt-1">
                      {autoTracking
                        ? "実行中ゲームを自動検出して監視開始"
                        : "手動でのゲーム登録のみ"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ログ・デバッグ */}
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="mb-3">
              <h4 className="font-medium">ログ・デバッグ</h4>
              <p className="text-sm text-base-content/70">トラブルシューティング用</p>
            </div>
            <div className="form-control">
              <button className="btn btn-outline btn-sm w-fit" onClick={handleOpenLogsDirectory}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6" />
                </svg>
                ログフォルダを開く
              </button>
              <p className="text-xs text-base-content/50 mt-2">
                アプリケーションのログファイルが保存されているフォルダを開きます
              </p>
            </div>
          </div>
        </div>

        {/* デフォルト設定グループ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-l-4 border-accent pl-4">
            <h3 className="text-lg font-semibold text-accent mb-1">デフォルト設定</h3>
            <p className="text-sm text-base-content/60">ホーム画面の初期表示設定</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* デフォルトソート */}
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="mb-3">
                <h4 className="font-medium">ソート順</h4>
                <p className="text-sm text-base-content/70">初期表示時のソート方法</p>
              </div>
              <div className="form-control">
                <div className="mb-2">
                  <p className="text-xs text-base-content/60 mt-1">
                    {`現在: ${sortOptionLabels[defaultSortOption]}`}
                  </p>
                </div>
                <select
                  className="select select-bordered select-sm"
                  value={defaultSortOption}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                >
                  {Object.entries(sortOptionLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* デフォルトフィルター */}
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="mb-3">
                <h4 className="font-medium">フィルター</h4>
                <p className="text-sm text-base-content/70">初期表示時のフィルター状態</p>
              </div>
              <div className="form-control">
                <div className="mb-2">
                  <p className="text-xs text-base-content/60 mt-1">
                    {`現在: ${filterStateLabels[defaultFilterState]}`}
                  </p>
                </div>
                <select
                  className="select select-bordered select-sm"
                  value={defaultFilterState}
                  onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
                >
                  {Object.entries(filterStateLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
