import { useCallback, useEffect } from "react"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtom, useAtomValue } from "jotai"
import { FaArrowLeftLong } from "react-icons/fa6"
import { visibleGamesAtom } from "@renderer/state/home"
import { isValidCredsAtom } from "@renderer/state/credentials"
import { useGameSaveData } from "@renderer/hooks/useGameSaveData"
import { useGameEdit } from "@renderer/hooks/useGameEdit"
import DynamicImage from "@renderer/components/DynamicImage"
import ConfirmModal from "@renderer/components/ConfirmModal"
import GameFormModal from "@renderer/components/GameModal"
import GameActionButtons from "@renderer/components/GameActionButtons"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filteredGames, setFilteredGames] = useAtom(visibleGamesAtom)
  const isValidCreds = useAtomValue(isValidCredsAtom)
  const validateCreds = useValidateCreds()

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

  if (!id) {
    return <Navigate to="/" replace />
  }
  if (!game) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-base-200 px-6">
      <button onClick={handleBack} className="btn btn-ghost mb-4">
        <FaArrowLeftLong />
      </button>

      <div className="card card-side bg-base-100 shadow-xl p-4 flex flex-col lg:flex-row gap-6">
        {/* 左：サムネイル */}
        <figure className="flex-shrink-0 w-full lg:w-1/2 aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden">
          <DynamicImage
            src={game.imagePath ?? ""}
            alt={game.title}
            className="w-full h-full object-contain text-black"
          />
        </figure>

        {/* 右：情報＆アクション */}
        <div className="flex-1 flex flex-col justify-between bg-base-100 p-4">
          {/* ── 上部エリア ── */}
          <div className="pt-4">
            <h2 className="card-title text-3xl mb-1">{game.title}</h2>
            <p className="text-lg text-gray-600 mb-4">{game.publisher}</p>

            {/* メタ情報 */}
            <div className="flex flex-wrap text-sm text-gray-500 gap-4 mb-6">
              <span>最終プレイ: {game.lastPlayed?.toDateString() ?? "なし"}</span>
              <span>総プレイ時間: {game.totalPlayTime ?? 0} 分</span>
            </div>
          </div>

          {/* ── 下部エリア ── */}
          <GameActionButtons
            onLaunch={handleLaunchGame}
            onEdit={openEdit}
            onDelete={openDelete}
            onUpload={handleUploadSaveData}
            onDownload={handleDownloadSaveData}
            isLaunching={isLaunching}
            isUploading={isUploading}
            isDownloading={isDownloading}
            hasSaveFolder={!!game.saveFolderPath}
            isValidCreds={isValidCreds}
          />
        </div>
      </div>
      {/* ここに統計パネルやプレイ履歴カレンダーなどを追加 */}

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
    </div>
  )
}
