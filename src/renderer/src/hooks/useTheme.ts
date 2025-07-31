/**
 * @fileoverview テーマ管理フック
 *
 * DaisyUIテーマの状態管理と永続化を提供するフックです。
 *
 * 主な機能：
 * - 現在のテーマの取得・保存
 * - LocalStorageでの永続化
 * - リアルタイムでのテーマ変更
 * - 保存状態の管理
 */

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"

import { logger } from "@renderer/utils/logger"

import type { ThemeName } from "../constants/themes"
import { DAISYUI_THEMES } from "../constants/themes"

/**
 * テーマフックの戻り値
 */
export type UseThemeResult = {
  /** 現在のテーマ */
  currentTheme: ThemeName
  /** テーマ変更中かどうか */
  isSaving: boolean
  /** テーマ変更ハンドラー */
  handleThemeChange: (newTheme: ThemeName) => Promise<void>
}

/**
 * テーマ管理フック
 *
 * DaisyUIテーマの状態管理と永続化を提供します。
 *
 * @returns テーマ管理インターフェース
 */
export function useTheme(): UseThemeResult {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("light")
  const [isSaving, setIsSaving] = useState(false)

  /**
   * 初期化時にLocalStorageからテーマを復元
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeName
    if (savedTheme && DAISYUI_THEMES.includes(savedTheme)) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  /**
   * テーマ変更ハンドラー
   *
   * @param newTheme 新しいテーマ名
   */
  const handleThemeChange = useCallback(async (newTheme: ThemeName): Promise<void> => {
    setIsSaving(true)
    try {
      // HTMLのdata-theme属性を更新
      document.documentElement.setAttribute("data-theme", newTheme)

      // LocalStorageに保存
      localStorage.setItem("theme", newTheme)

      // 状態を更新
      setCurrentTheme(newTheme)

      toast.success(`テーマを「${newTheme}」に変更しました`)
    } catch (error) {
      logger.error("テーマの変更に失敗:", {
        component: "useTheme",
        function: "unknown",
        data: error
      })
      toast.error("テーマの変更に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    currentTheme,
    isSaving,
    handleThemeChange
  }
}
