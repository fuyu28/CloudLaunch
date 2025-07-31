import { isValidCredsAtom } from "@renderer/state/credentials"
import { visibleGamesAtom, currentGameIdAtom } from "@renderer/state/home"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { FaArrowLeftLong } from "react-icons/fa6"
import { useParams, useNavigate, Navigate } from "react-router-dom"

import ChapterAddModal from "@renderer/components/ChapterAddModal"
import ChapterDisplayCard from "@renderer/components/ChapterDisplayCard"
import ChapterSettingsModal from "@renderer/components/ChapterSettingsModal"
import CloudDataCard from "@renderer/components/CloudDataCard"
import ConfirmModal from "@renderer/components/ConfirmModal"
import GameInfo from "@renderer/components/GameInfo"
import GameFormModal from "@renderer/components/GameModal"
import MemoCard from "@renderer/components/MemoCard"
import PlaySessionManagementModal from "@renderer/components/PlaySessionManagementModal"
import PlaySessionModal from "@renderer/components/PlaySessionModal"
import PlayStatistics from "@renderer/components/PlayStatistics"

import { useGameEdit } from "@renderer/hooks/useGameEdit"
import { useGameSaveData } from "@renderer/hooks/useGameSaveData"
import { useOfflineMode } from "@renderer/hooks/useOfflineMode"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"

import { logger } from "@renderer/utils/logger"

import type { GameType } from "src/types/game"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const setVisibleGames = useSetAtom(visibleGamesAtom)
  const setCurrentGameId = useSetAtom(currentGameIdAtom)
  const visibleGames = useAtomValue(visibleGamesAtom)
  const isValidCreds = useAtomValue(isValidCredsAtom)
  const validateCreds = useValidateCreds()
  const [game, setGame] = useState<GameType | undefined>(undefined)
  const [isLoadingGame, setIsLoadingGame] = useState(true)
  const [isPlaySessionModalOpen, setIsPlaySessionModalOpen] = useState(false)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isChapterSettingsModalOpen, setIsChapterSettingsModalOpen] = useState(false)
  const [isChapterAddModalOpen, setIsChapterAddModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const { showToast } = useToastHandler()
  const { isOfflineMode, checkNetworkFeature } = useOfflineMode()

  // ゲームデータを取得
  useEffect(() => {
    if (!id) return

    const fetchGame = async (): Promise<void> => {
      setIsLoadingGame(true)
      try {
        // まずvisibleGamesから検索
        const existingGame = visibleGames.find((g) => g.id === id)
        if (existingGame) {
          setGame(existingGame)
          setCurrentGameId(id)
          setIsLoadingGame(false)
          return
        }

        // visibleGamesにない場合は直接データベースから取得
        const fetchedGame = await window.api.database.getGameById(id)
        if (fetchedGame) {
          // APIから返されたデータは既にtransformされているのでそのまま使用
          const transformedGame = fetchedGame as GameType
          setGame(transformedGame)
          setCurrentGameId(id)
          // visibleGamesも更新
          setVisibleGames((prev) => {
            const exists = prev.find((g) => g.id === id)
            return exists ? prev : [...prev, transformedGame]
          })
        } else {
          setGame(undefined)
        }
      } catch (error) {
        logger.error("ゲームデータの取得に失敗", {
          component: "GameDetail",
          function: "loadGame",
          error: error instanceof Error ? error : new Error(String(error)),
          data: { gameId: id }
        })
        setGame(undefined)
      } finally {
        setIsLoadingGame(false)
      }
    }

    fetchGame()
  }, [id, visibleGames, setCurrentGameId, setVisibleGames])

  // コンポーネントのアンマウント時にIDをクリア
  useEffect(() => {
    return () => {
      setCurrentGameId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // カスタムフック
  const { uploadSaveData, downloadSaveData, isUploading, isDownloading } = useGameSaveData()
  const {
    editData,
    isEditModalOpen,
    isDeleteModalOpen,
    isLaunching,
    openEdit,
    closeEdit,
    onEditClosed,
    openDelete,
    closeDelete,
    handleUpdateGame,
    handleDeleteGame,
    handleLaunchGame
  } = useGameEdit(game, navigate, setVisibleGames)

  useEffect(() => {
    if (!isOfflineMode) {
      validateCreds()
    }
  }, [validateCreds, isOfflineMode])

  const handleBack = useCallback(() => navigate(-1), [navigate])

  // セーブデータ操作のコールバック
  const handleUploadSaveData = useCallback(async (): Promise<void> => {
    if (!checkNetworkFeature("セーブデータアップロード")) {
      return
    }
    if (game) {
      await uploadSaveData(game)
    }
  }, [game, uploadSaveData, checkNetworkFeature])

  const handleDownloadSaveData = useCallback(async (): Promise<void> => {
    if (!checkNetworkFeature("セーブデータダウンロード")) {
      return
    }
    if (game) {
      await downloadSaveData(game)
    }
  }, [game, downloadSaveData, checkNetworkFeature])

  // プレイセッション追加関連のコールバック
  const handleOpenPlaySessionModal = (): void => {
    setIsPlaySessionModalOpen(true)
  }

  const handleClosePlaySessionModal = (): void => {
    setIsPlaySessionModalOpen(false)
  }

  // 章管理モーダル関連のコールバック
  const handleOpenChapterSettings = (): void => {
    setIsChapterSettingsModalOpen(true)
  }

  const handleCloseChapterSettings = (): void => {
    setIsChapterSettingsModalOpen(false)
  }

  const handleOpenChapterAdd = (): void => {
    setIsChapterAddModalOpen(true)
  }

  const handleCloseChapterAdd = (): void => {
    setIsChapterAddModalOpen(false)
  }

  // 全データを再取得する関数
  const refreshGameData = useCallback(async () => {
    if (!game?.id) return

    try {
      // ゲームデータを再取得
      const updatedGame = await window.api.database.getGameById(game.id)

      if (updatedGame) {
        // ローカルの状態を更新（APIから返されたデータは既にtransformされている）
        const transformedGame = updatedGame as GameType
        setGame(transformedGame)
        // visibleGamesも更新
        setVisibleGames((prev) => prev.map((g) => (g.id === game.id ? transformedGame : g)))
      }
      // リフレッシュキーを更新してコンポーネントの再レンダリングを促す
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      logger.error("ゲームデータの更新に失敗", {
        component: "GameDetail",
        function: "refreshGameData",
        error: error instanceof Error ? error : new Error(String(error)),
        data: { gameId: game?.id }
      })
    }
  }, [game?.id, setVisibleGames])

  const handleChaptersUpdated = useCallback(async () => {
    await refreshGameData()
    showToast("章データが更新されました", "success")
  }, [refreshGameData, showToast])

  const handleAddPlaySession = useCallback(
    async (duration: number, sessionName?: string): Promise<void> => {
      if (!game) return

      try {
        const result = await window.api.database.createSession(duration, game.id, sessionName)
        if (result.success) {
          showToast("プレイセッションを追加しました", "success")
          // 全データを再取得
          await refreshGameData()
        } else {
          showToast(result.message || "プレイセッションの追加に失敗しました", "error")
        }
      } catch {
        showToast("プレイセッションの追加に失敗しました", "error")
      }
    },
    [game, showToast, refreshGameData]
  )

  // プレイステータス変更のハンドラー
  const handleStatusChange = useCallback(
    async (newStatus: "unplayed" | "playing" | "played"): Promise<void> => {
      if (!game) return

      setIsUpdatingStatus(true)
      try {
        // 現在のゲームデータを使用してupdateGameを呼び出し
        const updateData = {
          title: game.title,
          publisher: game.publisher,
          imagePath: game.imagePath,
          exePath: game.exePath,
          saveFolderPath: game.saveFolderPath,
          playStatus: newStatus
        }

        const result = await window.api.database.updateGame(game.id, updateData)

        if (result.success) {
          showToast("プレイステータスを更新しました", "success")
          // 全データを再取得
          await refreshGameData()
        } else {
          showToast(result.message || "プレイステータスの更新に失敗しました", "error")
        }
      } catch (error) {
        logger.error("プレイステータスの更新エラー", {
          component: "GameDetail",
          function: "handleStatusChange",
          error: error instanceof Error ? error : new Error(String(error)),
          data: { gameId: game.id, newStatus }
        })
        showToast("プレイステータスの更新に失敗しました", "error")
      } finally {
        setIsUpdatingStatus(false)
      }
    },
    [game, showToast, refreshGameData]
  )

  if (!id) {
    return <Navigate to="/" replace />
  }

  // ローディング中の表示
  if (isLoadingGame) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // ゲームが見つからない場合のみリダイレクト
  if (!game) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="bg-base-200 px-6 py-4">
      <button onClick={handleBack} className="btn btn-ghost mb-4">
        <FaArrowLeftLong />
        戻る
      </button>

      {/* 上段：ゲーム情報カード */}
      <div className="mb-3">
        <GameInfo
          game={game}
          isUpdatingStatus={isUpdatingStatus}
          isLaunching={isLaunching}
          onStatusChange={(status) =>
            handleStatusChange(status as "unplayed" | "playing" | "played")
          }
          onLaunchGame={handleLaunchGame}
          onEditGame={openEdit}
          onDeleteGame={openDelete}
        />
      </div>

      {/* 中段：プレイ統計 */}
      <div className="mb-4">
        <PlayStatistics
          game={game}
          refreshKey={refreshKey}
          onAddPlaySession={handleOpenPlaySessionModal}
          onOpenProcessManagement={() => setIsProcessModalOpen(true)}
        />
      </div>

      {/* 下段：その他の管理機能 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 章表示・管理カード */}
        <ChapterDisplayCard
          key={`chapter-display-${refreshKey}`}
          gameId={game.id}
          gameTitle={game.title}
          currentChapterId={game.currentChapter || undefined}
          onChapterSettings={handleOpenChapterSettings}
          onAddChapter={handleOpenChapterAdd}
          onChapterChange={refreshGameData}
        />

        {/* クラウドデータ管理カード */}
        <CloudDataCard
          gameId={game.id}
          gameTitle={game.title}
          hasSaveFolder={!!game.saveFolderPath}
          isValidCreds={isValidCreds}
          isUploading={isUploading}
          isDownloading={isDownloading}
          onUpload={handleUploadSaveData}
          onDownload={handleDownloadSaveData}
        />

        {/* メモ管理カード */}
        <MemoCard gameId={game.id} />
      </div>

      {/* モーダル */}

      {/* 削除 */}
      <ConfirmModal
        id="delete-game-modal"
        isOpen={isDeleteModalOpen}
        message={`${game.title} を削除しますか？\nこの操作は取り消せません`}
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={handleDeleteGame}
        onCancel={closeDelete}
      />

      {/* 編集 */}
      <GameFormModal
        mode="edit"
        initialData={editData}
        isOpen={isEditModalOpen}
        onSubmit={handleUpdateGame}
        onClose={closeEdit}
        onClosed={onEditClosed}
      />

      {/* プレイセッション追加 */}
      <PlaySessionModal
        isOpen={isPlaySessionModalOpen}
        onClose={handleClosePlaySessionModal}
        onSubmit={handleAddPlaySession}
        gameTitle={game.title}
      />

      {/* 章設定 */}
      <ChapterSettingsModal
        isOpen={isChapterSettingsModalOpen}
        gameId={game.id}
        onClose={handleCloseChapterSettings}
        onChaptersUpdated={handleChaptersUpdated}
      />

      {/* 章追加 */}
      <ChapterAddModal
        isOpen={isChapterAddModalOpen}
        gameId={game.id}
        onClose={handleCloseChapterAdd}
        onChapterAdded={handleChaptersUpdated}
      />

      {/* プロセス管理 */}
      <PlaySessionManagementModal
        isOpen={isProcessModalOpen}
        gameId={game.id}
        gameTitle={game.title}
        onClose={() => setIsProcessModalOpen(false)}
        onProcessUpdated={refreshGameData}
      />
    </div>
  )
}
