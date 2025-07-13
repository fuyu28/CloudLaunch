/**
 * @fileoverview メモ管理カードコンポーネント
 *
 * ゲーム詳細ページに表示されるメモ管理用のカードです。
 * メモ一覧への遷移と簡単なメモ情報を表示します。
 */

import React, { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { FaBookOpen, FaPlus } from "react-icons/fa"
import type { MemoType } from "src/types/memo"
import { useDropdownMenu } from "@renderer/hooks/useDropdownMenu"
import { useMemoOperations } from "@renderer/hooks/useMemoOperations"
import MemoCardBase from "./MemoCardBase"
import ConfirmModal from "./ConfirmModal"

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

  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-lg">
            <FaBookOpen className="text-primary" />
            メモ
          </h2>
          <div className="badge badge-outline">{memos.length}件</div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : memos.length > 0 ? (
          <div className="space-y-3">
            {/* 最新のメモを最大3件表示 */}
            {memos.slice(0, 3).map((memo) => (
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
              />
            ))}

            {/* もっとあることを示すインジケーター */}
            {memos.length > 3 && (
              <div className="text-center text-xs text-base-content/60">
                他 {memos.length - 3} 件のメモ
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-base-content/60 mb-4">
              <FaBookOpen className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">メモがありません</p>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="card-actions justify-center mt-4 space-y-2">
          {memos.length > 0 && (
            <Link to={`/memo/list/${gameId}`} className="btn btn-outline btn-sm w-full">
              <FaBookOpen />
              すべてのメモを見る
            </Link>
          )}
          <Link to={`/memo/new/${gameId}`} className="btn btn-primary btn-sm w-full">
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
