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
export interface GameActionButtonsProps {
  /** ゲーム起動時のコールバック */
  onLaunch: () => void
  /** ゲーム編集時のコールバック */
  onEdit: () => void
  /** ゲーム削除時のコールバック */
  onDelete: () => void
  /** ゲーム起動中かどうか */
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
  onLaunch,
  onEdit,
  onDelete,
  isLaunching = false
}: GameActionButtonsProps): React.JSX.Element {
  return (
    <div className="flex gap-3">
      <button
        onClick={onLaunch}
        disabled={isLaunching}
        className="btn btn-primary btn-md flex-1 flex max-w-60"
      >
        {isLaunching ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            起動中…
          </>
        ) : (
          <>
            <IoIosPlay size={24} />
            ゲームを起動
          </>
        )}
      </button>
      <button className="btn btn-outline btn-md flex-1 max-w-60" onClick={onEdit}>
        <MdEdit /> 編集
      </button>
      <button className="btn btn-error btn-md flex-1 max-w-60" onClick={onDelete}>
        <FaTrash /> 登録を解除
      </button>
    </div>
  )
}

export default GameActionButtons
