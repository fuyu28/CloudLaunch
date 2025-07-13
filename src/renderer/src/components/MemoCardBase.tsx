/**
 * @fileoverview メモカード基本コンポーネント
 *
 * メモカードの基本構造を提供する共通コンポーネントです。
 * MemoCardとMemoListで共通使用されます。
 */

import React from "react"
import { FaGamepad } from "react-icons/fa"
import type { MemoType } from "src/types/memo"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import MemoDropdownMenu from "./MemoDropdownMenu"

interface MemoCardBaseProps {
  /** メモデータ */
  memo: MemoType
  /** カードクリック時の処理 */
  onClick: (memoId: string) => void
  /** ドロップダウンが開いているかどうか */
  isDropdownOpen: boolean
  /** ドロップダウンの開閉処理 */
  onDropdownToggle: (memoId: string, event: React.MouseEvent) => void
  /** 編集ボタンクリック処理 */
  onEdit: (memoId: string, event: React.MouseEvent) => void
  /** 削除ボタンクリック処理 */
  onDelete: (memoId: string, event: React.MouseEvent) => void
  /** 同期ボタンクリック処理（オプション、メモ一覧ページのみ） */
  onSyncFromCloud?: (event: React.MouseEvent) => void
  /** カードのスタイルクラス（オプション） */
  className?: string
  /** タイトルの最大文字数（オプション、デフォルト: 制限なし） */
  titleMaxLength?: number
  /** 内容プレビューの最大文字数（オプション、デフォルト: 80） */
  contentMaxLength?: number
  /** ゲーム名を表示するかどうか（オプション、デフォルト: true） */
  showGameTitle?: boolean
  /** ドロップダウンメニューの位置クラス（オプション） */
  dropdownPosition?: string
}

/**
 * メモカード基本コンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns メモカードJSX要素
 */
export default function MemoCardBase({
  memo,
  onClick,
  isDropdownOpen,
  onDropdownToggle,
  onEdit,
  onDelete,
  onSyncFromCloud,
  className = "border border-base-300 rounded-lg p-3",
  titleMaxLength,
  contentMaxLength = 80,
  showGameTitle = true,
  dropdownPosition = "absolute top-2 right-2"
}: MemoCardBaseProps): React.JSX.Element {
  const { formatDateWithTime } = useTimeFormat()

  const truncatedTitle =
    titleMaxLength && memo.title.length > titleMaxLength
      ? `${memo.title.substring(0, titleMaxLength)}...`
      : memo.title

  const truncatedContent =
    memo.content.length > contentMaxLength
      ? `${memo.content.substring(0, contentMaxLength)}...`
      : memo.content

  return (
    <div
      className={`${className} cursor-pointer hover:bg-base-200 transition-colors duration-200 relative`}
      onClick={() => onClick(memo.id)}
    >
      <h3 className="font-semibold text-sm truncate mb-1 pr-8">{truncatedTitle}</h3>

      {/* ゲーム名表示 */}
      {showGameTitle && memo.gameTitle && (
        <div className="flex items-center gap-2 text-xs text-base-content/60 mb-2">
          <FaGamepad className="text-xs" />
          <span>{memo.gameTitle}</span>
        </div>
      )}

      {/* 内容のプレビュー */}
      <p className="text-xs text-base-content/60 line-clamp-2 mb-2">{truncatedContent}</p>

      {/* メタ情報 */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-base-content/50">{formatDateWithTime(memo.updatedAt)}</span>
      </div>

      {/* 三点リーダーメニュー */}
      <MemoDropdownMenu
        memoId={memo.id}
        isOpen={isDropdownOpen}
        onToggle={onDropdownToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onSyncFromCloud={onSyncFromCloud}
        className={dropdownPosition}
      />
    </div>
  )
}
