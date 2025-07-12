/**
 * @fileoverview メモ管理カードコンポーネント
 *
 * ゲーム詳細ページに表示されるメモ管理用のカードです。
 * メモ一覧への遷移と簡単なメモ情報を表示します。
 */

import React, { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaBookOpen, FaPlus, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa"
import { MemoType } from "src/preload/preload"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

interface MemoCardProps {
  gameId: string
}

export default function MemoCard({ gameId }: MemoCardProps): React.JSX.Element {
  const [memos, setMemos] = useState<MemoType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const { formatDateWithTime } = useTimeFormat()
  const navigate = useNavigate()

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

  // ドロップダウンメニューを閉じるためのクリックイベント
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element
      if (target && !target.closest(".dropdown")) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside)
      }, 0)
      return (): void => {
        document.removeEventListener("click", handleClickOutside)
      }
    }

    return undefined
  }, [openDropdownId])

  // メモ削除処理
  const handleDeleteMemo = async (memoId: string, event: React.MouseEvent): Promise<void> => {
    event.stopPropagation()
    setOpenDropdownId(null)

    if (confirm("このメモを削除してもよろしいですか？")) {
      try {
        const result = await window.api.memo.deleteMemo(memoId)
        if (result.success) {
          await fetchMemos() // メモ一覧を再取得
        } else {
          alert("メモの削除に失敗しました")
        }
      } catch (error) {
        console.error("メモ削除エラー:", error)
        alert("メモの削除中にエラーが発生しました")
      }
    }
  }

  // 編集ページへの遷移
  const handleEditMemo = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(null)
    navigate(`/memo/edit/${memoId}?from=game&gameId=${gameId}`)
  }

  // メモ詳細ページへの遷移
  const handleViewMemo = (memoId: string): void => {
    navigate(`/memo/view/${memoId}?from=game&gameId=${gameId}`)
  }

  // ドロップダウンの開閉
  const toggleDropdown = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(openDropdownId === memoId ? null : memoId)
  }

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
              <div
                key={memo.id}
                className="border border-base-300 rounded-lg p-3 cursor-pointer hover:bg-base-200 transition-colors duration-200 relative"
                onClick={() => handleViewMemo(memo.id)}
              >
                <h3 className="font-semibold text-sm truncate mb-1 pr-8">{memo.title}</h3>
                <p className="text-xs text-base-content/60 line-clamp-2 mb-2">
                  {memo.content.substring(0, 80)}
                  {memo.content.length > 80 && "..."}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/50">
                    {formatDateWithTime(memo.updatedAt)}
                  </span>
                </div>

                {/* 三点リーダーメニュー */}
                <div
                  className={`dropdown dropdown-end absolute top-2 right-2 ${openDropdownId === memo.id ? "dropdown-open" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-xs btn-ghost p-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDropdown(memo.id, e)
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
                      <button
                        onClick={(e) => handleEditMemo(memo.id, e)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <FaEdit />
                        編集
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={(e) => handleDeleteMemo(memo.id, e)}
                        className="flex items-center gap-2 text-xs text-error"
                      >
                        <FaTrash />
                        削除
                      </button>
                    </li>
                  </ul>
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
