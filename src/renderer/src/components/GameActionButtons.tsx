/**
 * @fileoverview ゲーム基本操作ボタンコンポーネント
 *
 * このコンポーネントは、ゲーム詳細ページで使用される基本的な操作ボタン群を提供します。
 *
 * 主な機能：
 * - ゲーム起動ボタン
 * - 編集・削除ボタン
 * - ローディング状態の表示
 *
 * 使用例：
 * ```tsx
 * <GameActionButtons
 *   onLaunch={handleLaunch}
 *   onEdit={openEdit}
 *   onDelete={() => setIsDeleteModalOpen(true)}
 *   isLaunching={isLaunching}
 * />
 * ```
 */

import { FaTrash } from "react-icons/fa"
import { IoIosPlay } from "react-icons/io"
import { MdEdit } from "react-icons/md"

/**
 * ゲーム基本操作ボタンコンポーネントのprops
 */
export type GameActionButtonsProps = {
  /** ゲームID */
  gameId: string
  /** セーブデータフォルダパス */
  saveDataFolderPath?: string
  /** ゲーム起動時のコールバック */
  onLaunchGame: () => void
  /** ゲーム編集時のコールバック */
  onEditGame: () => void
  /** ゲーム削除時のコールバック */
  onDeleteGame: () => void
  /** 起動中フラグ */
  isLaunching?: boolean
}

/**
 * ゲーム基本操作ボタンコンポーネント
 *
 * ゲーム詳細ページで使用される基本的な操作ボタン群を提供します。
 *
 * @param props コンポーネントのprops
 * @returns ゲーム基本操作ボタン要素
 */
export function GameActionButtons({
  onLaunchGame,
  onEditGame,
  onDeleteGame,
  isLaunching
}: GameActionButtonsProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      {/* 基本操作ボタン */}
      <div className="flex gap-3">
        <button
          onClick={onLaunchGame}
          className="btn btn-primary btn-md flex-1"
          disabled={isLaunching}
        >
          <IoIosPlay size={24} />
          {isLaunching ? "起動中..." : "ゲームを起動"}
        </button>
        <button className="btn btn-outline btn-md flex-1" onClick={onEditGame}>
          <MdEdit /> 編集
        </button>
        <button className="btn btn-error btn-md flex-1" onClick={onDeleteGame}>
          <FaTrash /> 登録を解除
        </button>
      </div>
    </div>
  )
}

export default GameActionButtons
