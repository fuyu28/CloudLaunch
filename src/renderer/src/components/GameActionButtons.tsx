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

import React from "react"
import { IoIosPlay } from "react-icons/io"
import { MdEdit } from "react-icons/md"
import { FaTrash } from "react-icons/fa"

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
    <div className="flex flex-col gap-3">
      {/* １行目：実行ボタン */}
      <button
        onClick={onLaunch}
        disabled={isLaunching}
        className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
      >
        {isLaunching ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-lg">起動中…</span>
          </>
        ) : (
          <>
            <IoIosPlay size={24} />
            <span className="text-lg font-medium">ゲームを起動</span>
          </>
        )}
      </button>

      {/* ２行目：編集／削除 */}
      <div className="flex gap-2">
        <button className="btn btn-outline btn-md flex-1" onClick={onEdit}>
          <MdEdit /> 編集
        </button>
        <button className="btn btn-error btn-md flex-1" onClick={onDelete}>
          <FaTrash /> 登録を解除
        </button>
      </div>
    </div>
  )
}

export default GameActionButtons
