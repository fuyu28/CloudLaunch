/**
 * @fileoverview オフラインモード判定用のカスタムフック
 *
 * オフラインモードの状態を管理し、ネットワーク機能の利用可否を判定します。
 *
 * 主な機能：
 * - オフラインモード設定の取得
 * - ネットワーク機能の利用可否判定
 * - オフラインモード時の適切なメッセージ表示
 *
 * 使用技術：
 * - Jotai atoms（状態管理）
 * - react-hot-toast（トースト表示）
 */

import { useAtom } from "jotai"
import toast from "react-hot-toast"
import { offlineModeAtom } from "../state/settings"

type OfflineModeHook = {
  /** オフラインモードが有効かどうか */
  isOfflineMode: boolean
  /** ネットワーク機能が利用可能かどうか */
  isNetworkAvailable: boolean
  /** オフラインモード時のエラーメッセージを表示 */
  showOfflineError: (feature?: string) => void
  /** ネットワーク機能実行前のチェック */
  checkNetworkFeature: (feature?: string) => boolean
}

/**
 * オフラインモード判定用のカスタムフック
 *
 * オフラインモードの状態を取得し、ネットワーク機能の利用可否を判定します。
 *
 * @returns オフラインモード関連の状態と関数
 *
 * @example
 * ```typescript
 * const { isOfflineMode, checkNetworkFeature, showOfflineError } = useOfflineMode()
 *
 * // ネットワーク機能実行前のチェック
 * if (!checkNetworkFeature("クラウド同期")) {
 *   return // オフラインモード時は自動でエラー表示
 * }
 *
 * // ネットワーク機能を実行
 * await uploadToCloud()
 * ```
 */
export function useOfflineMode(): OfflineModeHook {
  const [isOfflineMode] = useAtom(offlineModeAtom)

  const isNetworkAvailable = !isOfflineMode

  const showOfflineError = (feature = "この機能"): void => {
    toast.error(`${feature}はオフラインモードでは利用できません`)
  }

  const checkNetworkFeature = (feature = "この機能"): boolean => {
    if (isOfflineMode) {
      showOfflineError(feature)
      return false
    }
    return true
  }

  return {
    isOfflineMode,
    isNetworkAvailable,
    showOfflineError,
    checkNetworkFeature
  }
}
