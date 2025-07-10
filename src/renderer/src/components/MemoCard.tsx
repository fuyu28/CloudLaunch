/**
 * @fileoverview メモ管理カードコンポーネント
 *
 * ゲーム詳細ページに表示されるメモ管理用のカードです。
 * メモ一覧への遷移と簡単なメモ情報を表示します。
 */

import React, { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { FaBookOpen, FaPlus, FaEdit } from "react-icons/fa"
import { MemoType } from "src/preload/preload"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

interface MemoCardProps {
  gameId: string
}

export default function MemoCard({ gameId }: MemoCardProps): React.JSX.Element {
  const [memos, setMemos] = useState<MemoType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { formatDate } = useTimeFormat()

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
              <div key={memo.id} className="border border-base-300 rounded-lg p-3">
                <h3 className="font-semibold text-sm truncate mb-1">{memo.title}</h3>
                <p className="text-xs text-base-content/60 line-clamp-2 mb-2">
                  {memo.content.substring(0, 80)}
                  {memo.content.length > 80 && "..."}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/50">{formatDate(memo.updatedAt)}</span>
                  <Link to={`/memo/view/${memo.id}`} className="btn btn-xs btn-ghost">
                    <FaEdit />
                  </Link>
                </div>
              </div>
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
    </div>
  )
}
