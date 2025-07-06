/**
 * @fileoverview 時間フォーマットフック
 *
 * このファイルは、秒数を人間が読みやすい形式に変換するフックを提供します。
 *
 * 主な機能：
 * - 秒数から時間・分・秒への変換
 * - 短縮形式と詳細形式の提供
 * - 異なる言語・地域設定への対応
 *
 * 使用例：
 * ```tsx
 * const { formatDuration, formatShort, formatDate } = useTimeFormat()
 * const playTime = formatDuration(3661) // "1時間1分1秒"
 * const shortTime = formatShort(3661)   // "1:01:01"
 * const dateStr = formatDate(new Date()) // "2025年7月7日(月)"
 * ```
 */

import { useMemo } from "react"

/**
 * 時間フォーマット用のフック
 */
export interface TimeFormatHook {
  /** 詳細な時間フォーマット（例: "1時間30分45秒"） */
  formatDuration: (seconds: number) => string
  /** 短縮時間フォーマット（例: "1:30:45"） */
  formatShort: (seconds: number) => string
  /** 最適な時間フォーマット（短時間は分表示、長時間は時間表示） */
  formatSmart: (seconds: number) => string
  /** 日付フォーマット（例: "2025年7月7日(月)"） */
  formatDate: (date: Date) => string
}

/**
 * 時間フォーマットフック
 *
 * 秒数を人間が読みやすい形式に変換する各種フォーマット関数を提供します。
 *
 * @returns 時間フォーマット関数群
 */
export function useTimeFormat(): TimeFormatHook {
  const formatDuration = useMemo(() => {
    return (seconds: number): string => {
      if (seconds <= 0) return "0秒"

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60

      const parts: string[] = []

      if (hours > 0) {
        parts.push(`${hours}時間`)
      }
      if (minutes > 0) {
        parts.push(`${minutes}分`)
      }
      if (remainingSeconds > 0 || parts.length === 0) {
        parts.push(`${remainingSeconds}秒`)
      }

      return parts.join("")
    }
  }, [])

  const formatShort = useMemo(() => {
    return (seconds: number): string => {
      if (seconds <= 0) return "0:00"

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
      } else {
        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
      }
    }
  }, [])

  const formatSmart = useMemo(() => {
    return (seconds: number): string => {
      if (seconds <= 0) return "未プレイ"

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      if (hours > 0) {
        // 1時間以上の場合
        if (minutes > 0) {
          return `${hours}時間${minutes}分`
        } else {
          return `${hours}時間`
        }
      } else if (minutes > 0) {
        // 1分以上1時間未満の場合
        return `${minutes}分`
      } else {
        // 1分未満の場合
        return `${seconds}秒`
      }
    }
  }, [])

  const formatDate = useMemo(() => {
    return (date: Date): string => {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]

      return `${year}年${month}月${day}日(${dayOfWeek})`
    }
  }, [])

  return {
    formatDuration,
    formatShort,
    formatSmart,
    formatDate
  }
}

/**
 * 時間変換ユーティリティ関数（非hooks版）
 * フック外で使用する場合
 */
export const timeUtils = {
  /**
   * 秒数を時、分、秒に分解
   * @param seconds 総秒数
   * @returns 時、分、秒のオブジェクト
   */
  parseSeconds: (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return { hours, minutes, seconds: remainingSeconds }
  },

  /**
   * 時、分、秒を秒数に変換
   * @param hours 時間
   * @param minutes 分
   * @param seconds 秒
   * @returns 総秒数
   */
  toSeconds: (hours: number, minutes: number, seconds: number): number => {
    return hours * 3600 + minutes * 60 + seconds
  },

  /**
   * 詳細フォーマット（非hooks版）
   * @param seconds 秒数
   * @returns フォーマット済み文字列
   */
  formatDuration: (seconds: number): string => {
    if (seconds <= 0) return "0秒"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const parts: string[] = []

    if (hours > 0) {
      parts.push(`${hours}時間`)
    }
    if (minutes > 0) {
      parts.push(`${minutes}分`)
    }
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds}秒`)
    }

    return parts.join("")
  },

  /**
   * スマートフォーマット（非hooks版）
   * @param seconds 秒数
   * @returns フォーマット済み文字列
   */
  formatSmart: (seconds: number): string => {
    if (seconds <= 0) return "未プレイ"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}時間${minutes}分`
      } else {
        return `${hours}時間`
      }
    } else if (minutes > 0) {
      return `${minutes}分`
    } else {
      return `${seconds}秒`
    }
  },

  /**
   * 日付フォーマット（非hooks版）
   * @param date 日付
   * @returns フォーマット済み文字列（例: "2025年7月7日(月)"）
   */
  formatDate: (date: Date): string => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]

    return `${year}年${month}月${day}日(${dayOfWeek})`
  }
}

export default useTimeFormat
