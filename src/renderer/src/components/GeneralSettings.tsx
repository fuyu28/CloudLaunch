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
 * - 起動時の自動計測の設定
 * - 設定の永続化
 * - リアルタイムでの変更反映
 *
 * 使用技術：
 * - Jotai atoms（状態管理）
 * - DaisyUI コンポーネント
 */

import React from "react"
import { useAtom } from "jotai"
import toast from "react-hot-toast"
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
import { DAISYUI_THEMES } from "../constants/themes"
import type { SortOption, FilterOption } from "src/types/menu"

/**
 * 一般設定コンポーネント
 *
 * テーマ選択、デフォルトソート順、デフォルトフィルター状態、
 * オフラインモード、起動時の自動計測など、アプリケーションの一般的な設定を提供します。
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

  // 自動計測変更ハンドラー
  const handleAutoTrackingChange = (enabled: boolean): void => {
    setAutoTracking(enabled)
    if (enabled) {
      toast.success("起動時の自動計測を有効にしました")
    } else {
      toast.success("起動時の自動計測を無効にしました")
    }
  }

  return (
    <div className="card bg-base-100 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">一般設定</h2>

      <div className="space-y-8">
        {/* テーマ選択セクション */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">テーマ</h3>
            <p className="text-sm text-base-content/70">
              アプリケーションの外観テーマを選択できます
            </p>
          </div>

          <div className="form-control max-w-sm">
            <label className="label pb-2">
              <span className="label-text">現在のテーマ: {currentTheme}</span>
            </label>
            <div className="flex items-center space-x-2">
              <select
                className="select select-bordered scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-transparent"
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
              {isChangingTheme && <button className="btn btn-square btn-ghost loading" disabled />}
            </div>
          </div>
        </div>

        {/* デフォルトソート設定セクション */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">デフォルトソート順</h3>
            <p className="text-sm text-base-content/70">
              ホーム画面で最初に表示されるソート順を設定できます
            </p>
          </div>

          <div className="form-control max-w-sm">
            <label className="label pb-2">
              <span className="label-text">現在の設定: {sortOptionLabels[defaultSortOption]}</span>
            </label>
            <select
              className="select select-bordered"
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

        {/* デフォルトフィルター設定セクション */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">デフォルトフィルター</h3>
            <p className="text-sm text-base-content/70">
              ホーム画面で最初に表示されるフィルター状態を設定できます
            </p>
          </div>

          <div className="form-control max-w-sm">
            <label className="label pb-2">
              <span className="label-text">
                現在の設定: {filterStateLabels[defaultFilterState]}
              </span>
            </label>
            <select
              className="select select-bordered"
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

        {/* オフラインモード設定セクション */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">オフラインモード</h3>
            <p className="text-sm text-base-content/70">
              ネットワーク接続が必要な機能（クラウド同期等）を無効にします
            </p>
          </div>

          <div className="form-control max-w-sm">
            <label className="label cursor-pointer justify-start">
              <input
                type="checkbox"
                className="toggle toggle-primary mr-3"
                checked={offlineMode}
                onChange={(e) => handleOfflineModeChange(e.target.checked)}
              />
              <span className="label-text">
                {offlineMode ? "オフラインモード有効" : "オフラインモード無効"}
              </span>
            </label>
            <div className="mt-2">
              <p className="text-xs text-base-content/50">
                {offlineMode ? "クラウド機能が無効になっています" : "すべての機能が利用可能です"}
              </p>
            </div>
          </div>
        </div>

        {/* 起動時の自動計測設定セクション */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">起動時の自動計測</h3>
            <p className="text-sm text-base-content/70">
              アプリ起動時にプレイ時間の計測を自動で開始するかどうかを設定できます
            </p>
          </div>

          <div className="form-control max-w-sm">
            <label className="label cursor-pointer justify-start">
              <input
                type="checkbox"
                className="toggle toggle-primary mr-3"
                checked={autoTracking}
                onChange={(e) => handleAutoTrackingChange(e.target.checked)}
              />
              <span className="label-text">{autoTracking ? "自動計測有効" : "自動計測無効"}</span>
            </label>
            <div className="mt-2">
              <p className="text-xs text-base-content/50">
                {autoTracking
                  ? "アプリ起動時に自動でプレイ時間計測を開始します"
                  : "手動で自動検出を有効化する必要があります"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
