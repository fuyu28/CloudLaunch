/**
 * @fileoverview メモ管理カードコンポーネント
 *
 * ゲーム詳細ページに表示されるメモ管理用のカードです。
 * メモ一覧への遷移と簡単なメモ情報を表示します。
 */

import { useDropdownMenu } from "@renderer/hooks/useDropdownMenu"
import { useMemoOperations } from "@renderer/hooks/useMemoOperations"
import { useEffect, useState, useCallback, useMemo } from "react"
import { FaBookOpen, FaPlus } from "react-icons/fa"
import { Link } from "react-router-dom"

import ConfirmModal from "./ConfirmModal"
import MemoCardBase from "./MemoCardBase"

import type { MemoType } from "src/types/memo"

interface MemoCardProps {
  gameId: string
}

export default function MemoCard({ gameId }: MemoCardProps): React.JSX.Element {
  const [memos, setMemos] = useState<MemoType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 共通フックを使用
  const { toggleDropdown, closeDropdown, isOpen } = useDropdownMenu()
  const {
    handleDeleteMemo,
    handleEditMemo,
    handleViewMemo,
    handleDeleteConfirm,
    handleSyncFromCloud
  } = useMemoOperations({
    gameId,
    onDeleteSuccess: () => {
      fetchMemos() // メモ削除後に一覧を再取得
      setDeleteConfirmId(null)
    },
    closeDropdown,
    openDeleteModal: setDeleteConfirmId,
    onSyncSuccess: () => {
      fetchMemos() // 同期後にメモ一覧を再取得
    }
  })

  // メモ一覧を取得
  const fetchMemos = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await window.api.memo.getMemosByGameId(gameId)
      if (result.success && result.data) {
        setMemos(result.data)
      }
    } catch (error) {
      console.error("メモ取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  // 表示するメモリストと統計をメモ化
  const displayData = useMemo(() => {
    const displayMemos = memos.slice(0, 3)
    const remainingCount = Math.max(0, memos.length - 3)

    return {
      displayMemos,
      remainingCount,
      totalCount: memos.length,
      hasMore: remainingCount > 0
    }
  }, [memos])

  // メモ統計情報をメモ化
  const memoStats = useMemo(() => {
    if (memos.length === 0) return null

    const totalChars = memos.reduce((sum, memo) => sum + memo.content.length, 0)
    const avgChars = Math.round(totalChars / memos.length)

    return {
      totalChars,
      avgChars
    }
  }, [memos])

  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-lg">
            <FaBookOpen className="text-primary" />
            メモ
          </h2>
          <div className="flex items-center gap-2">
            <div className="badge badge-primary badge-outline">{displayData.totalCount}件</div>
            {memoStats && (
              <div className="badge badge-ghost text-xs">平均{memoStats.avgChars}文字</div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : displayData.totalCount > 0 ? (
          <div className="space-y-3 min-h-0 flex-1">
            {/* 最新のメモを最大3件表示 */}
            <div className="space-y-2">
              {displayData.displayMemos.map((memo) => (
                <MemoCardBase
                  key={memo.id}
                  memo={memo}
                  onClick={handleViewMemo}
                  isDropdownOpen={isOpen(memo.id)}
                  onDropdownToggle={toggleDropdown}
                  onEdit={handleEditMemo}
                  onDelete={handleDeleteConfirm}
                  onSyncFromCloud={handleSyncFromCloud}
                  showGameTitle={false}
                  className="border border-base-300 rounded-lg p-3 hover:shadow-md transition-shadow"
                  contentMaxLength={60}
                />
              ))}
            </div>

            {/* もっとあることを示すインジケーター */}
            {displayData.hasMore && (
              <div className="bg-base-200 rounded-lg p-2 text-center">
                <span className="text-xs text-base-content/70 font-medium">
                  他 {displayData.remainingCount} 件のメモ
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <div className="text-base-content/60">
              <FaBookOpen className="mx-auto text-4xl mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">メモがありません</p>
              <p className="text-xs opacity-75">ゲームについてのメモを作成しましょう</p>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="card-actions justify-center mt-4 space-y-2 flex-shrink-0">
          {displayData.totalCount > 0 && (
            <Link
              to={`/memo/list/${gameId}`}
              className="btn btn-outline btn-sm w-full hover:bg-primary hover:text-primary-content transition-colors"
            >
              <FaBookOpen />
              すべてのメモを見る
            </Link>
          )}
          <Link
            to={`/memo/new/${gameId}`}
            className="btn btn-primary btn-sm w-full shadow-sm hover:shadow-md transition-shadow"
          >
            <FaPlus />
            新しいメモ
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        id="delete-memo-modal"
        isOpen={!!deleteConfirmId}
        message="このメモを削除しますか？この操作は取り消せません。"
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={() => deleteConfirmId && handleDeleteMemo(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  )
}
