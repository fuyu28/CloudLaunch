import { useCallback, useEffect, useState } from "react"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtom, useAtomValue } from "jotai"
import { FaArrowLeftLong } from "react-icons/fa6"
import { visibleGamesAtom } from "@renderer/state/home"
import { isValidCredsAtom } from "@renderer/state/credentials"
import { useGameSaveData } from "@renderer/hooks/useGameSaveData"
import { useGameEdit } from "@renderer/hooks/useGameEdit"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import DynamicImage from "@renderer/components/DynamicImage"
import ConfirmModal from "@renderer/components/ConfirmModal"
import GameFormModal from "@renderer/components/GameModal"
import GameActionButtons from "@renderer/components/GameActionButtons"
import PlaySessionModal from "@renderer/components/PlaySessionModal"
import PlaySessionCard from "@renderer/components/PlaySessionCard"
import CloudDataCard from "@renderer/components/CloudDataCard"
import ChapterBarChart from "@renderer/components/ChapterBarChart"
import ChapterDisplayCard from "@renderer/components/ChapterDisplayCard"
import ChapterSettingsModal from "@renderer/components/ChapterSettingsModal"
import ChapterAddModal from "@renderer/components/ChapterAddModal"
import PlaySessionManagementModal from "@renderer/components/PlaySessionManagementModal"
import { useToastHandler } from "@renderer/hooks/useToastHandler"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filteredGames, setFilteredGames] = useAtom(visibleGamesAtom)
  const isValidCreds = useAtomValue(isValidCredsAtom)
  const validateCreds = useValidateCreds()
  const [isPlaySessionModalOpen, setIsPlaySessionModalOpen] = useState(false)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isChapterSettingsModalOpen, setIsChapterSettingsModalOpen] = useState(false)
  const [isChapterAddModalOpen, setIsChapterAddModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { showToast } = useToastHandler()
  const { formatSmart, formatDate } = useTimeFormat()

  const game = filteredGames.find((g) => g.id === id)

  // カスタムフック
  const { uploadSaveData, downloadSaveData, isUploading, isDownloading } = useGameSaveData()
  const {
    editData,
    isEditModalOpen,
    isDeleteModalOpen,
    isLaunching,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
    handleUpdateGame,
    handleDeleteGame,
    handleLaunchGame
  } = useGameEdit(game, navigate, setFilteredGames)

  useEffect(() => {
    validateCreds()
  }, [validateCreds])

  const handleBack = useCallback(() => navigate(-1), [navigate])

  // セーブデータ操作のコールバック
  const handleUploadSaveData = useCallback(async (): Promise<void> => {
    if (game) {
      await uploadSaveData(game)
    }
  }, [game, uploadSaveData])

  const handleDownloadSaveData = useCallback(async (): Promise<void> => {
    if (game) {
      await downloadSaveData(game)
    }
  }, [game, downloadSaveData])

  // プレイセッション追加関連のコールバック
  const handleOpenPlaySessionModal = useCallback(() => {
    setIsPlaySessionModalOpen(true)
  }, [])

  const handleClosePlaySessionModal = useCallback(() => {
    setIsPlaySessionModalOpen(false)
  }, [])

  // 章管理モーダル関連のコールバック
  const handleOpenChapterSettings = useCallback(() => {
    setIsChapterSettingsModalOpen(true)
  }, [])

  const handleCloseChapterSettings = useCallback(() => {
    setIsChapterSettingsModalOpen(false)
  }, [])

  const handleOpenChapterAdd = useCallback(() => {
    setIsChapterAddModalOpen(true)
  }, [])

  const handleCloseChapterAdd = useCallback(() => {
    setIsChapterAddModalOpen(false)
  }, [])

  // 全データを再取得する関数
  const refreshGameData = useCallback(async () => {
    if (!game?.id) return

    try {
      // ゲームデータを再取得
      const updatedGame = await window.api.database.getGameById(game.id)
      if (updatedGame) {
        setFilteredGames((prev) => prev.map((g) => (g.id === game.id ? updatedGame : g)))
      }
      // リフレッシュキーを更新してコンポーネントの再レンダリングを促す
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error("ゲームデータの更新に失敗:", error)
    }
  }, [game?.id, setFilteredGames])

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

  if (!id) {
    return <Navigate to="/" replace />
  }
  if (!game) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="bg-base-200 px-6 py-4">
      <button onClick={handleBack} className="btn btn-ghost mb-4">
        <FaArrowLeftLong />
        戻る
      </button>

      {/* 上部：ゲーム情報カード */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左：サムネイル */}
            <figure className="flex-shrink-0 w-full lg:w-80 aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden">
              <DynamicImage
                src={game.imagePath ?? ""}
                alt={game.title}
                className="w-full h-full object-contain text-black"
              />
            </figure>

            {/* 右：情報＆アクション */}
            <div className="flex-1 flex flex-col justify-between">
              {/* ゲーム情報 */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                <p className="text-lg text-base-content/70 mb-4">{game.publisher}</p>

                {/* メタ情報 */}
                <div className="flex flex-wrap text-sm text-base-content/60 gap-4 mb-6">
                  <span>最終プレイ: {game.lastPlayed ? formatDate(game.lastPlayed) : "なし"}</span>
                  <span>総プレイ時間: {formatSmart(game.totalPlayTime ?? 0)}</span>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="mt-4">
                <GameActionButtons
                  onLaunch={handleLaunchGame}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  isLaunching={isLaunching}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 中部：章統計グラフ */}
      <div className="mb-6">
        <ChapterBarChart
          key={`chapter-chart-${refreshKey}`}
          gameId={game.id}
          gameTitle={game.title}
        />
      </div>

      {/* 下部：機能カード群 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* プレイセッション管理カード */}
        <PlaySessionCard
          key={`play-session-${refreshKey}`}
          gameId={game.id}
          gameTitle={game.title}
          onAddSession={handleOpenPlaySessionModal}
          onSessionUpdated={refreshGameData}
          onProcessManagement={() => setIsProcessModalOpen(true)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
        </div>
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
