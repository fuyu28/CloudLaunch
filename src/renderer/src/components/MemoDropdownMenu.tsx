/**
 * @fileoverview メモ三点リーダーメニューコンポーネント
 *
 * メモカードに表示される三点リーダーメニューの共通コンポーネントです。
 * MemoCardとMemoListで共通使用されます。
 */

import React from "react"
import { FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa"

interface MemoDropdownMenuProps {
  /** メモID */
  memoId: string
  /** ドロップダウンが開いているかどうか */
  isOpen: boolean
  /** ドロップダウンの開閉処理 */
  onToggle: (memoId: string, event: React.MouseEvent) => void
  /** 編集ボタンクリック処理 */
  onEdit: (memoId: string, event: React.MouseEvent) => void
  /** 削除ボタンクリック処理 */
  onDelete: (memoId: string, event: React.MouseEvent) => void
  /** 絶対位置のスタイルクラス（オプション） */
  className?: string
}

/**
 * メモ三点リーダーメニューコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns メモドロップダウンメニューJSX要素
 */
export default function MemoDropdownMenu({
  memoId,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  className = "absolute top-2 right-2"
}: MemoDropdownMenuProps): React.JSX.Element {
  return (
    <div
      className={`dropdown dropdown-end ${className} ${isOpen ? "dropdown-open" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        tabIndex={0}
        role="button"
        className="btn btn-xs btn-ghost p-1"
        onClick={(e) => {
          e.stopPropagation()
          onToggle(memoId, e)
        }}
      >
        <FaEllipsisV className="text-xs" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow border border-base-300"
        onClick={(e) => e.stopPropagation()}
      >
        <li>
          <button onClick={(e) => onEdit(memoId, e)} className="flex items-center gap-2 text-xs">
            <FaEdit />
            編集
          </button>
        </li>
        <li>
          <button
            onClick={(e) => onDelete(memoId, e)}
            className="flex items-center gap-2 text-xs text-error"
          >
            <FaTrash />
            削除
          </button>
        </li>
      </ul>
    </div>
  )
}
