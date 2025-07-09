/**
 * @fileoverview オフラインモード関連のユーティリティ関数
 *
 * オフラインモードに関する判定やメッセージ処理を行うユーティリティです。
 *
 * 主な機能：
 * - ネットワーク機能の判定
 * - オフライン時の代替動作
 * - 機能の有効/無効状態の管理
 */

/**
 * ネットワーク機能を必要とする機能の一覧
 */
export const NETWORK_FEATURES = {
  CLOUD_SYNC: "クラウド同期",
  UPLOAD_SAVE_DATA: "セーブデータアップロード",
  DOWNLOAD_SAVE_DATA: "セーブデータダウンロード",
  CREDENTIAL_TEST: "接続テスト",
  CLOUD_BACKUP: "クラウドバックアップ"
} as const

export type NetworkFeature = (typeof NETWORK_FEATURES)[keyof typeof NETWORK_FEATURES]

/**
 * 指定された機能がネットワークを必要とするかどうかを判定
 *
 * @param feature 機能名
 * @returns ネットワークが必要な機能の場合true
 */
export function isNetworkFeature(feature: string): feature is NetworkFeature {
  return Object.values(NETWORK_FEATURES).includes(feature as NetworkFeature)
}

/**
 * オフラインモード時に無効化すべきUI要素のクラスを取得
 *
 * @param isOfflineMode オフラインモードかどうか
 * @returns 無効化用のCSSクラス
 */
export function getOfflineDisabledClasses(isOfflineMode: boolean): string {
  return isOfflineMode ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
}

/**
 * オフラインモード時の警告メッセージを取得
 *
 * @param feature 機能名
 * @returns 警告メッセージ
 */
export function getOfflineWarningMessage(feature: NetworkFeature): string {
  return `${feature}はオフラインモードでは利用できません。設定からオフラインモードを無効にしてください。`
}

/**
 * ネットワーク機能実行時の共通チェック関数
 *
 * @param isOfflineMode オフラインモードかどうか
 * @param feature 実行しようとする機能名
 * @param onError エラー時のコールバック
 * @returns 実行可能な場合true
 */
export function checkNetworkFeatureExecution(
  isOfflineMode: boolean,
  feature: NetworkFeature,
  onError?: (message: string) => void
): boolean {
  if (isOfflineMode) {
    const message = getOfflineWarningMessage(feature)
    onError?.(message)
    return false
  }
  return true
}
