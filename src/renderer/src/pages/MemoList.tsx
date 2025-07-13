/**
 * @fileoverview メモ一覧ページ
 *
 * すべてのメモの一覧を表示し、メモの閲覧・作成・編集・削除を管理します。
 * サイドメニューからアクセス可能な全メモ閲覧画面です。
 */

import React, { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaPlus, FaFolder, FaFilter } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import type { MemoType } from "src/types/memo"
import type { GameType } from "src/types/game"
import FloatingButton from "@renderer/components/FloatingButton"
import { useDropdownMenu } from "@renderer/hooks/useDropdownMenu"
import { useMemoOperations } from "@renderer/hooks/useMemoOperations"
import MemoCardBase from "@renderer/components/MemoCardBase"
import ConfirmModal from "@renderer/components/ConfirmModal"

export default function MemoList(): React.JSX.Element {
  const { showToast } = useToastHandler()
  const navigate = useNavigate()

  const [memos, setMemos] = useState<MemoType[]>([])
  const [games, setGames] = useState<GameType[]>([])
  const [filteredMemos, setFilteredMemos] = useState<MemoType[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 共通フックを使用
  const { toggleDropdown, closeDropdown, isOpen } = useDropdownMenu()
  const { handleDeleteMemo, handleEditMemo, handleViewMemo, handleDeleteConfirm } =
    useMemoOperations({
      onDeleteSuccess: (deletedMemoId) => {
        setMemos((prev) => prev.filter((memo) => memo.id !== deletedMemoId))
        setFilteredMemos((prev) => prev.filter((memo) => memo.id !== deletedMemoId))
        setDeleteConfirmId(null)
      },
      closeDropdown,
      openDeleteModal: setDeleteConfirmId
    })

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

  // ゲームフィルター適用
  useEffect(() => {
    if (selectedGameId === "all") {
      setFilteredMemos(memos)
    } else {
      setFilteredMemos(memos.filter((memo) => memo.gameId === selectedGameId))
    }
  }, [memos, selectedGameId])

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
            <MemoCardBase
              key={memo.id}
              memo={memo}
              onClick={handleViewMemo}
              isDropdownOpen={isOpen(memo.id)}
              onDropdownToggle={toggleDropdown}
              onEdit={handleEditMemo}
              onDelete={handleDeleteConfirm}
              className="card bg-base-100 shadow-xl p-6"
              contentMaxLength={100}
              dropdownPosition="absolute top-0 right-0"
            />
          ))}
        </div>
      )}

      {/* フローティング追加ボタン */}
      <FloatingButton onClick={() => navigate("/memo/create")} ariaLabel="新しいメモを作成">
        <FaPlus className="text-lg" />
      </FloatingButton>

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
