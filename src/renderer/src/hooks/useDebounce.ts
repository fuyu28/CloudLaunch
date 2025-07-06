/**
 * @fileoverview デバウンス機能フック
 *
 * このフックは、値の変更を一定時間遅延させるデバウンス機能を提供します。
 * 主な機能：
 * - 入力値の変更を遅延
 * - 過度なAPI呼び出しの防止
 * - パフォーマンス最適化
 * - タイマー自動管理
 *
 * 使用例：
 * ```tsx
 * const debouncedSearchTerm = useDebounce(searchTerm, 300)
 * ```
 */

import { useEffect, useState } from "react"

/**
 * デバウンス機能フック
 *
 * 指定された値の変更を一定時間遅延させます。
 * 検索フィールドやAPIリクエストの最適化に使用します。
 *
 * @param value - デバウンス対象の値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
