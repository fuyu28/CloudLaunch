/**
 * @fileoverview 一般設定コンポーネント
 *
 * アプリケーションの一般的な設定項目を管理するコンポーネントです。
 *
 * 主な機能：
 * - DaisyUIテーマの選択・変更
 * - 設定の永続化
 * - リアルタイムでの変更反映
 *
 * 使用技術：
 * - Jotai atoms（テーマ状態管理）
 * - DaisyUI コンポーネント
 */

import React from "react"
import { useAtom } from "jotai"
import { themeAtom, changeThemeAtom, isChangingThemeAtom } from "../state/settings"
import { DAISYUI_THEMES } from "../constants/themes"

/**
 * 一般設定コンポーネント
 *
 * テーマ選択など、アプリケーションの一般的な設定を提供します。
 *
 * @returns 一般設定コンポーネント要素
 */
export default function GeneralSettings(): React.JSX.Element {
  const [currentTheme] = useAtom(themeAtom)
  const [isChangingTheme] = useAtom(isChangingThemeAtom)
  const [, changeTheme] = useAtom(changeThemeAtom)

  return (
    <div className="card bg-base-100 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">一般設定</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* テーマ選択セクション */}
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-medium">テーマ</h3>
            <p className="text-sm text-base-content/70">
              アプリケーションの外観テーマを選択できます
            </p>
          </div>

          <div className="md:col-span-2 form-control max-w-sm">
            <label className="label pb-2">
              <span className="label-text">現在のテーマ: {currentTheme}</span>
            </label>
            <div className="flex items-center space-x-2">
              <select
                className="select select-bordered flex-none w-auto inline-block scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-transparent"
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
      </div>
    </div>
  )
}
