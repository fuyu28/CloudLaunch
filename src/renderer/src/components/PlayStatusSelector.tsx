/**
 * @fileoverview プレイステータス選択コンポーネント
 *
 * このコンポーネントは、ゲームのプレイステータスを選択・変更するためのUIを提供します。
 *
 * 主な機能：
 * - プレイステータスの視覚的表示（バッジ形式）
 * - ドロップダウンメニューでのステータス変更
 * - 各ステータスに応じた色分け
 * - 変更時のコールバック処理
 *
 * 使用例：
 * ```tsx
 * <PlayStatusSelector
 *   currentStatus={game.playStatus}
 *   onStatusChange={handleStatusChange}
 *   disabled={isUpdating}
 * />
 * ```
 */

import { FaChevronDown, FaGamepad, FaPlay, FaCheck } from "react-icons/fa"

/**
 * プレイステータスの型定義
 */
export type PlayStatus = "unplayed" | "playing" | "played"

/**
 * プレイステータス選択コンポーネントのprops
 */
export type PlayStatusSelectorProps = {
  /** 現在のプレイステータス */
  currentStatus: PlayStatus
  /** ステータス変更時のコールバック */
  onStatusChange: (status: PlayStatus) => void
  /** 無効化フラグ */
  disabled?: boolean
}

/**
 * プレイステータス情報の設定
 */
const STATUS_CONFIG = {
  unplayed: {
    label: "未プレイ",
    icon: FaGamepad,
    badgeClass: "badge-neutral",
    description: "まだプレイしていない"
  },
  playing: {
    label: "プレイ中",
    icon: FaPlay,
    badgeClass: "badge-primary",
    description: "現在プレイしている"
  },
  played: {
    label: "クリア済み",
    icon: FaCheck,
    badgeClass: "badge-success",
    description: "クリア済み"
  }
} as const

/**
 * プレイステータス選択コンポーネント
 *
 * ゲームのプレイステータスを選択・変更するためのドロップダウンコンポーネントです。
 *
 * @param props コンポーネントのprops
 * @returns プレイステータス選択要素
 */
export function PlayStatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false
}: PlayStatusSelectorProps): React.JSX.Element {
  const currentConfig = STATUS_CONFIG[currentStatus]

  const handleStatusChange = (status: PlayStatus): void => {
    if (disabled) return

    onStatusChange(status)

    // ドロップダウンを閉じるためにblurする
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
      activeElement.blur()
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">プレイステータス:</span>

        <div className="dropdown dropdown-bottom">
          <div
            tabIndex={0}
            role="button"
            className={`badge ${currentConfig.badgeClass} gap-2 cursor-pointer hover:opacity-80 transition-opacity ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <currentConfig.icon className="w-3 h-3" />
            {currentConfig.label}
            <FaChevronDown className="w-2 h-2 transition-transform" />
          </div>

          {!disabled && (
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300"
            >
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const StatusIcon = config.icon
                const isSelected = status === currentStatus

                return (
                  <li key={status}>
                    <button
                      className={`flex items-center gap-3 ${isSelected ? "bg-base-200" : ""}`}
                      onClick={() => handleStatusChange(status as PlayStatus)}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs text-base-content/60">{config.description}</div>
                      </div>
                      {isSelected && <FaCheck className="w-3 h-3 text-success" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayStatusSelector
