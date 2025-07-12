/**
 * @fileoverview メモ一覧ページ
 *
 * すべてのメモの一覧を表示し、メモの閲覧・作成・編集・削除を管理します。
 * サイドメニューからアクセス可能な全メモ閲覧画面です。
 */

import React, { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaPlus, FaEdit, FaTrash, FaFolder, FaGamepad, FaFilter, FaEllipsisV } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { MemoType } from "src/preload/preload"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import type { GameType } from "src/types/game"
import FloatingButton from "@renderer/components/FloatingButton"

export default function MemoList(): React.JSX.Element {
  const { showToast } = useToastHandler()
  const { formatDateWithTime } = useTimeFormat()
  const navigate = useNavigate()

  const [memos, setMemos] = useState<MemoType[]>([])
  const [games, setGames] = useState<GameType[]>([])
  const [filteredMemos, setFilteredMemos] = useState<MemoType[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // 全メモ一覧とゲーム一覧を取得する関数
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 全メモ一覧を取得
      const memoResult = await window.api.memo.getAllMemos()
      if (memoResult.success && memoResult.data) {
        setMemos(memoResult.data)
        setFilteredMemos(memoResult.data)
      } else {
        showToast("メモの取得に失敗しました", "error")
      }

      // ゲーム一覧を取得（フィルター用）
      const gameResult = await window.api.database.listGames("", "all", "title")
      if (gameResult && Array.isArray(gameResult)) {
        // データベースの型をGameType型に変換
        const transformedGames: GameType[] = gameResult.map((game) => ({
          ...game,
          saveFolderPath: game.saveFolderPath ?? undefined,
          imagePath: game.imagePath ?? undefined
        }))
        setGames(transformedGames)
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      showToast("データの取得に失敗しました", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  // ゲームフィルター適用
  useEffect(() => {
    if (selectedGameId === "all") {
      setFilteredMemos(memos)
    } else {
      setFilteredMemos(memos.filter((memo) => memo.gameId === selectedGameId))
    }
  }, [memos, selectedGameId])

  // メモ削除処理
  const handleDeleteMemo = useCallback(
    async (memoId: string, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation()
      }
      setOpenDropdownId(null)

      try {
        const result = await window.api.memo.deleteMemo(memoId)
        if (result.success) {
          showToast("メモを削除しました", "success")
          setMemos((prev) => prev.filter((memo) => memo.id !== memoId))
          setFilteredMemos((prev) => prev.filter((memo) => memo.id !== memoId))
        } else {
          showToast(result.message || "メモの削除に失敗しました", "error")
        }
      } catch (error) {
        console.error("メモ削除エラー:", error)
        showToast("メモの削除に失敗しました", "error")
      }
      setDeleteConfirmId(null)
    },
    [showToast]
  )

  // 編集ページへの遷移
  const handleEditMemo = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(null)
    navigate(`/memo/edit/${memoId}`)
  }

  // メモ詳細ページへの遷移
  const handleViewMemo = (memoId: string): void => {
    navigate(`/memo/view/${memoId}`)
  }

  // ドロップダウンの開閉
  const toggleDropdown = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(openDropdownId === memoId ? null : memoId)
  }

  // 削除確認処理
  const handleDeleteConfirm = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(null)
    setDeleteConfirmId(memoId)
  }

  // メモフォルダを開く処理
  const handleOpenMemoFolder = useCallback(async () => {
    try {
      const result = await window.api.memo.getMemoRootDir()
      if (result.success && result.data) {
        await window.api.window.openFolder(result.data)
        showToast("メモフォルダを開きました", "success")
      } else {
        showToast("メモフォルダの取得に失敗しました", "error")
      }
    } catch (error) {
      console.error("フォルダ操作エラー:", error)
      showToast("フォルダを開けませんでした", "error")
    }
  }, [showToast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="bg-base-200 px-6 py-4 min-h-screen">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">すべてのメモ</h1>
        </div>

        <div className="flex gap-2">
          <button onClick={handleOpenMemoFolder} className="btn btn-outline">
            <FaFolder />
            フォルダを開く
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FaFilter className="text-base-content/60" />
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="select select-bordered w-auto min-w-48"
          >
            <option value="all">すべてのゲーム</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
          <span className="text-sm text-base-content/60">{filteredMemos.length}件のメモ</span>
        </div>
      </div>

      {/* メモ一覧 */}
      {filteredMemos.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-base-content/70">メモがありません</h2>
            <p className="text-base-content/60">
              新しいメモを作成して、ゲームに関する情報を記録しましょう
            </p>
            <div className="card-actions justify-center mt-4">
              <Link to="/memo/create" className="btn btn-primary">
                <FaPlus />
                最初のメモを作成
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredMemos.map((memo) => (
            <div
              key={memo.id}
              className="card bg-base-100 shadow-xl cursor-pointer hover:bg-base-200 transition-colors duration-200 relative"
              onClick={() => handleViewMemo(memo.id)}
            >
              <div className="card-body">
                <h2 className="card-title text-lg pr-8">{memo.title}</h2>

                {/* ゲーム名表示 */}
                {memo.gameTitle && (
                  <div className="flex items-center gap-2 text-sm text-base-content/60 mb-2">
                    <FaGamepad className="text-xs" />
                    <span>{memo.gameTitle}</span>
                  </div>
                )}

                {/* 内容のプレビュー */}
                <p className="text-base-content/70 line-clamp-3 text-sm">
                  {memo.content.substring(0, 100)}
                  {memo.content.length > 100 && "..."}
                </p>

                {/* メタ情報 */}
                <div className="text-xs text-base-content/50 mt-2">
                  <div>作成: {formatDateWithTime(memo.createdAt)}</div>
                  {memo.updatedAt !== memo.createdAt && (
                    <div>更新: {formatDateWithTime(memo.updatedAt)}</div>
                  )}
                </div>

                {/* 三点リーダーメニュー */}
                <div
                  className={`dropdown dropdown-end absolute top-4 right-4 ${openDropdownId === memo.id ? "dropdown-open" : ""}`}
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
                        onClick={(e) => handleDeleteConfirm(memo.id, e)}
                        className="flex items-center gap-2 text-xs text-error"
                      >
                        <FaTrash />
                        削除
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フローティング追加ボタン */}
      <FloatingButton onClick={() => navigate("/memo/create")} ariaLabel="新しいメモを作成">
        <FaPlus className="text-lg" />
      </FloatingButton>

      {/* 削除確認モーダル */}
      {deleteConfirmId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">メモの削除</h3>
            <p className="py-4">このメモを削除しますか？この操作は取り消せません。</p>
            <div className="modal-action">
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-ghost">
                キャンセル
              </button>
              <button
                onClick={() => deleteConfirmId && handleDeleteMemo(deleteConfirmId)}
                className="btn btn-error"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
