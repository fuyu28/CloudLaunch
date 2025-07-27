/**
 * @fileoverview メモ一覧ページ
 *
 * すべてのメモの一覧を表示し、メモの閲覧・作成・編集・削除を管理します。
 * サイドメニューからアクセス可能な全メモ閲覧画面です。
 */

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FaPlus,
  FaFolder,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSort,
  FaSync
} from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { useDebounce } from "@renderer/hooks/useDebounce"
import type { MemoType } from "src/types/memo"
import type { GameType } from "src/types/game"
import FloatingButton from "@renderer/components/FloatingButton"
import { useDropdownMenu } from "@renderer/hooks/useDropdownMenu"
import { useMemoOperations } from "@renderer/hooks/useMemoOperations"
import MemoCardBase from "@renderer/components/MemoCardBase"
import ConfirmModal from "@renderer/components/ConfirmModal"

type SortOption = "updatedAt" | "createdAt" | "title"
type SortDirection = "asc" | "desc"

export default function MemoList(): React.JSX.Element {
  const { showToast } = useToastHandler()
  const navigate = useNavigate()

  const [memos, setMemos] = useState<MemoType[]>([])
  const [games, setGames] = useState<GameType[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 検索クエリのデバウンス処理
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // 共通フックを使用
  const { toggleDropdown, closeDropdown, isOpen } = useDropdownMenu()
  const {
    handleDeleteMemo,
    handleEditMemo,
    handleViewMemo,
    handleDeleteConfirm,
    handleSyncFromCloud
  } = useMemoOperations({
    onDeleteSuccess: (deletedMemoId) => {
      setMemos((prev) => prev.filter((memo) => memo.id !== deletedMemoId))
      setDeleteConfirmId(null)
    },
    closeDropdown,
    openDeleteModal: setDeleteConfirmId,
    onSyncSuccess: () => {
      fetchData() // 同期後にメモ一覧を再取得
    }
  })

  // フィルタリング・ソート処理
  const filteredAndSortedMemos = useMemo(() => {
    let filtered = [...memos]

    // ゲームフィルター
    if (selectedGameId !== "all") {
      filtered = filtered.filter((memo) => memo.gameId === selectedGameId)
    }

    // タイトル検索フィルター
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (memo) =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.gameTitle?.toLowerCase().includes(query)
      )
    }

    // ソート処理
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title, "ja")
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "updatedAt":
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [memos, selectedGameId, debouncedSearchQuery, sortBy, sortDirection])

  // 全メモ一覧とゲーム一覧を取得する関数
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 全メモ一覧を取得
      const memoResult = await window.api.memo.getAllMemos()
      if (memoResult.success && memoResult.data) {
        setMemos(memoResult.data)
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

  // ソート方向を切り替える関数
  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }, [])

  // 検索をクリアする関数
  const clearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

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
          <button onClick={(e) => handleSyncFromCloud(e)} className="btn btn-success btn-outline">
            <FaSync />
            同期
          </button>
          <button onClick={handleOpenMemoFolder} className="btn btn-outline">
            <FaFolder />
            フォルダを開く
          </button>
        </div>
      </div>

      {/* 検索・フィルター・ソート - レスポンシブ対応 */}
      <div className="mb-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* 検索バー */}
              <div className="lg:col-span-2">
                <label className="label label-text text-xs font-semibold mb-1">検索</label>
                <div className="flex items-center gap-2">
                  <FaSearch className="text-base-content/60 flex-shrink-0" />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="タイトル、内容、ゲーム名で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-bordered input-sm w-full pr-8"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content text-sm"
                        aria-label="検索をクリア"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ゲームフィルター */}
              <div>
                <label className="label label-text text-xs font-semibold mb-1">ゲーム</label>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-base-content/60 flex-shrink-0" />
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="all">すべて</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ソート設定 */}
              <div>
                <label className="label label-text text-xs font-semibold mb-1">並び順</label>
                <div className="flex items-center gap-2">
                  <FaSort className="text-base-content/60 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="select select-bordered select-sm flex-1"
                  >
                    <option value="updatedAt">更新日時</option>
                    <option value="createdAt">作成日時</option>
                    <option value="title">タイトル</option>
                  </select>
                  <button
                    onClick={toggleSortDirection}
                    className="btn btn-ghost btn-sm btn-square"
                    title={sortDirection === "asc" ? "昇順" : "降順"}
                    aria-label={`並び順を${sortDirection === "asc" ? "降順" : "昇順"}に変更`}
                  >
                    {sortDirection === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                  </button>
                </div>
              </div>
            </div>

            {/* メモ件数とクイックアクション */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-base-300">
              <div className="flex items-center gap-4">
                <span className="text-sm text-base-content/70 font-medium">
                  {filteredAndSortedMemos.length}件のメモ
                </span>
                {debouncedSearchQuery && (
                  <span className="badge badge-info badge-sm">
                    検索中: &quot;{debouncedSearchQuery}&quot;
                  </span>
                )}
                {selectedGameId !== "all" && (
                  <span className="badge badge-primary badge-sm">
                    {games.find((g) => g.id === selectedGameId)?.title}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {(searchQuery || selectedGameId !== "all") && (
                  <button
                    onClick={() => {
                      clearSearch()
                      setSelectedGameId("all")
                    }}
                    className="btn btn-ghost btn-xs"
                  >
                    フィルターをクリア
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メモ一覧 */}
      {filteredAndSortedMemos.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            {memos.length === 0 ? (
              <>
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
              </>
            ) : (
              <>
                <h2 className="card-title justify-center text-base-content/70">
                  条件に一致するメモがありません
                </h2>
                <p className="text-base-content/60">検索条件やフィルターを変更してみてください</p>
                <div className="card-actions justify-center mt-4">
                  <button onClick={clearSearch} className="btn btn-outline">
                    検索をクリア
                  </button>
                  <button onClick={() => setSelectedGameId("all")} className="btn btn-outline">
                    すべてのゲーム
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredAndSortedMemos.map((memo) => (
            <MemoCardBase
              key={memo.id}
              memo={memo}
              onClick={handleViewMemo}
              isDropdownOpen={isOpen(memo.id)}
              onDropdownToggle={toggleDropdown}
              onEdit={handleEditMemo}
              onDelete={handleDeleteConfirm}
              onSyncFromCloud={handleSyncFromCloud}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 p-4 h-48 flex flex-col"
              contentMaxLength={120}
              dropdownPosition="absolute top-2 right-2"
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
