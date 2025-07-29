/**
 * @fileoverview メモ一覧ページ
 *
 * すべてのメモの一覧を表示し、メモの閲覧・作成・編集・削除を管理します。
 * サイドメニューからアクセス可能な全メモ閲覧画面です。
 */

import { useEffect, useState, useCallback, useMemo } from "react"
import { CiSearch } from "react-icons/ci"
import { FaPlus, FaFolder, FaSync } from "react-icons/fa"
import { IoFilterOutline } from "react-icons/io5"
import { TbSortAscending, TbSortDescending } from "react-icons/tb"
import { VscChromeClose } from "react-icons/vsc"
import { Link, useNavigate } from "react-router-dom"

import ConfirmModal from "@renderer/components/ConfirmModal"
import FloatingButton from "@renderer/components/FloatingButton"
import MemoCardBase from "@renderer/components/MemoCardBase"

import { useDebounce } from "@renderer/hooks/useDebounce"
import { useDropdownMenu } from "@renderer/hooks/useDropdownMenu"
import { useMemoOperations } from "@renderer/hooks/useMemoOperations"
import { useToastHandler } from "@renderer/hooks/useToastHandler"

import type { GameType } from "src/types/game"
import type { MemoType } from "src/types/memo"

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

      {/* 検索・フィルター・ソート */}
      <div className="bg-base-100 p-4 rounded-lg mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 検索バー */}
          <div className="flex-1">
            <label htmlFor="memo-search" className="input input-bordered flex items-center gap-2">
              <CiSearch className="w-4 h-4 opacity-70" />
              <input
                id="memo-search"
                type="search"
                className="grow"
                placeholder="メモタイトル、内容、ゲーム名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="text-base-content/60 hover:text-base-content"
                  aria-label="検索をクリア"
                >
                  <VscChromeClose className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>

          {/* コントロール群 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* ソート設定 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium opacity-70">並び順</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="select select-bordered select-sm w-auto min-w-24"
                aria-label="ソート順を選択"
              >
                <option value="updatedAt">更新日時</option>
                <option value="createdAt">作成日時</option>
                <option value="title">タイトル</option>
              </select>
              <button
                type="button"
                onClick={toggleSortDirection}
                className="btn btn-ghost btn-sm btn-circle"
                title={sortDirection === "asc" ? "昇順（A→Z, 古→新）" : "降順（Z→A, 新→古）"}
                aria-label={`${sortDirection === "asc" ? "昇順" : "降順"}で表示中。クリックで切り替え`}
              >
                {sortDirection === "asc" ? (
                  <TbSortAscending className="w-4 h-4" />
                ) : (
                  <TbSortDescending className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* ゲームフィルター */}
            <div className="flex items-center gap-2">
              <IoFilterOutline className="w-4 h-4 opacity-70" />
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="select select-bordered select-sm w-auto min-w-32"
                aria-label="ゲームでフィルター"
              >
                <option value="all">すべてのゲーム</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* メモ件数とクイックアクション */}
      <div className="flex justify-between items-center mb-4">
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
