/**
 * @fileoverview メモ一覧ページ
 *
 * 指定されたゲームに関連するメモの一覧を表示し、メモの閲覧・作成・編集・削除を管理します。
 * ゲーム詳細ページからリンクして表示される専用ページです。
 */

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaEye, FaFolder } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { MemoType } from "src/preload/preload"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

export default function MemoList(): React.JSX.Element {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastHandler()
  const { formatDate } = useTimeFormat()

  const [memos, setMemos] = useState<MemoType[]>([])
  const [gameTitle, setGameTitle] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ゲーム情報とメモ一覧を取得する関数
  const fetchData = useCallback(async () => {
    if (!gameId) return

    setIsLoading(true)
    try {
      // ゲーム情報を取得
      const gameResult = await window.api.database.getGameById(gameId)
      if (gameResult) {
        setGameTitle(gameResult.title)
      }

      // メモ一覧を取得
      const memoResult = await window.api.memo.getMemosByGameId(gameId)
      if (memoResult.success && memoResult.data) {
        setMemos(memoResult.data)
      } else {
        showToast("メモの取得に失敗しました", "error")
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      showToast("データの取得に失敗しました", "error")
    } finally {
      setIsLoading(false)
    }
  }, [gameId, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // メモ削除処理
  const handleDeleteMemo = useCallback(
    async (memoId: string) => {
      try {
        const result = await window.api.memo.deleteMemo(memoId)
        if (result.success) {
          showToast("メモを削除しました", "success")
          setMemos((prev) => prev.filter((memo) => memo.id !== memoId))
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

  // 戻るボタン処理
  const handleBack = useCallback(() => {
    navigate(`/game/${gameId}`)
  }, [navigate, gameId])

  // メモフォルダを開く処理
  const handleOpenMemoFolder = useCallback(async () => {
    if (!gameId) return

    try {
      const result = await window.api.memo.getGameMemoDir(gameId)
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
  }, [gameId, showToast])

  if (!gameId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-error">ゲームIDが指定されていません</div>
      </div>
    )
  }

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
          <button onClick={handleBack} className="btn btn-ghost">
            <FaArrowLeft />
            戻る
          </button>
          <h1 className="text-2xl font-bold">{gameTitle} のメモ</h1>
        </div>

        <div className="flex gap-2">
          <button onClick={handleOpenMemoFolder} className="btn btn-outline">
            <FaFolder />
            フォルダを開く
          </button>
          <Link to={`/memo/new/${gameId}`} className="btn btn-primary">
            <FaPlus />
            新しいメモ
          </Link>
        </div>
      </div>

      {/* メモ一覧 */}
      {memos.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-base-content/70">メモがありません</h2>
            <p className="text-base-content/60">
              新しいメモを作成して、ゲームに関する情報を記録しましょう
            </p>
            <div className="card-actions justify-center mt-4">
              <Link to={`/memo/new/${gameId}`} className="btn btn-primary">
                <FaPlus />
                最初のメモを作成
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {memos.map((memo) => (
            <div key={memo.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">{memo.title}</h2>

                {/* 内容のプレビュー */}
                <p className="text-base-content/70 line-clamp-3 text-sm">
                  {memo.content.substring(0, 100)}
                  {memo.content.length > 100 && "..."}
                </p>

                {/* メタ情報 */}
                <div className="text-xs text-base-content/50 mt-2">
                  <div>作成: {formatDate(memo.createdAt)}</div>
                  {memo.updatedAt !== memo.createdAt && (
                    <div>更新: {formatDate(memo.updatedAt)}</div>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="card-actions justify-end mt-4">
                  <Link to={`/memo/view/${memo.id}`} className="btn btn-sm btn-outline">
                    <FaEye />
                    閲覧
                  </Link>
                  <Link to={`/memo/edit/${memo.id}`} className="btn btn-sm btn-outline">
                    <FaEdit />
                    編集
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(memo.id)}
                    className="btn btn-sm btn-outline btn-error"
                  >
                    <FaTrash />
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
