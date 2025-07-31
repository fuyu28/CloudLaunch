/**
 * @fileoverview 設定関連のJotai atoms
 *
 * アプリケーションの設定値をグローバルに管理するatoms。
 * LocalStorageとの同期も自動的に行われます。
 *
 * 主な機能：
 * - テーマ設定の管理
 * - デフォルトソート順の管理
 * - デフォルトフィルターの管理
 * - オフラインモードの管理
 * - 起動時の自動計測の管理
 * - LocalStorageとの自動同期
 */

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import toast from "react-hot-toast"

import { logger } from "@renderer/utils/logger"

import type { ThemeName } from "../constants/themes"
import type { SortOption, FilterOption } from "src/types/menu"

/**
 * 設定関連のatoms
 */

/**
 * テーマ設定atom
 * LocalStorageに自動保存される
 */
export const themeAtom = atomWithStorage<ThemeName>("theme", "light")

/**
 * デフォルトソート順atom
 * LocalStorageに自動保存される
 */
export const defaultSortOptionAtom = atomWithStorage<SortOption>("defaultSortOption", "title")

/**
 * デフォルトフィルター状態atom
 * LocalStorageに自動保存される
 */
export const defaultFilterStateAtom = atomWithStorage<FilterOption>("defaultFilterState", "all")

/**
 * オフラインモード設定atom
 * LocalStorageに自動保存される
 */
export const offlineModeAtom = atomWithStorage<boolean>("offlineMode", false)

/**
 * 起動時の自動計測設定atom
 * LocalStorageに自動保存される
 */
export const autoTrackingAtom = atomWithStorage<boolean>("autoTracking", true)

/**
 * テーマ変更中の状態atom
 * 一時的な状態なのでLocalStorageには保存しない
 */
export const isChangingThemeAtom = atom(false)

/**
 * テーマ変更アクションatom
 * テーマを変更し、HTMLのdata-theme属性も更新する
 */
export const changeThemeAtom = atom(null, async (_, set, newTheme: ThemeName) => {
  set(isChangingThemeAtom, true)
  try {
    // HTMLのdata-theme属性を更新
    document.documentElement.setAttribute("data-theme", newTheme)

    // atomを更新（LocalStorageにも自動保存される）
    set(themeAtom, newTheme)

    // 成功トースト
    toast.success(`テーマを「${newTheme}」に変更しました`)

    return { success: true }
  } catch (error) {
    logger.error("テーマの変更に失敗:", { component: "settings", function: "unknown", data: error })
    toast.error("テーマの変更に失敗しました")
    return { success: false, error }
  } finally {
    set(isChangingThemeAtom, false)
  }
})

/**
 * ソート順の表示名マップ
 */
export const sortOptionLabels: Record<SortOption, string> = {
  title: "タイトル順",
  lastPlayed: "最近プレイした順",
  totalPlayTime: "プレイ時間が長い順",
  publisher: "ブランド順",
  lastRegistered: "最近登録した順"
}

/**
 * フィルター状態の表示名マップ
 */
export const filterStateLabels: Record<FilterOption, string> = {
  all: "すべて",
  unplayed: "未プレイ",
  playing: "プレイ中",
  played: "クリア済み"
}
