import { useCallback, useEffect, useState } from "react"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtom, useAtomValue } from "jotai"
import { IoIosPlay } from "react-icons/io"
import { MdEdit } from "react-icons/md"
import { FaTrash } from "react-icons/fa"
import { FaArrowLeftLong } from "react-icons/fa6"
import toast from "react-hot-toast"
import { visibleGamesAtom } from "@renderer/state/home"
import DynamicImage from "@renderer/components/DynamicImage"
import ConfirmModal from "@renderer/components/ConfirmModal"
import GameFormModal from "@renderer/components/GameModal"
import { InputGameData } from "src/types/game"
import { ApiResult } from "src/types/result"
import { isValidCredsAtom } from "@renderer/state/credentials"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filteredGames, setFilteredGames] = useAtom(visibleGamesAtom)
  const isValidCreds = useAtomValue(isValidCredsAtom)
  const validateCreds = useValidateCreds()

  useEffect(() => {
    validateCreds()
  }, [validateCreds])

  const [isLaunching, setIsLaunching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editData, setEditData] = useState<InputGameData | null>(null)

  const game = filteredGames.find((g) => g.id === id)

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const closeEditModal = useCallback(() => setIsEditModalOpen(false), [])

  const closeDeleteModal = useCallback(() => setIsDeleteModalOpen(false), [])

  const openEdit = useCallback(() => {
    if (!game) return
    const { title, publisher, imagePath, exePath, saveFolderPath, playStatus } = game
    setEditData({
      title,
      publisher,
      imagePath: imagePath ?? undefined,
      exePath,
      saveFolderPath: saveFolderPath ?? undefined,
      playStatus
    })
    setIsEditModalOpen(true)
  }, [game])

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!game) return
    const result = await window.api.database.deleteGame(game.id)
    if (result.success) {
      toast.success("ゲームを削除しました。")
      setFilteredGames((g) => g.filter((x) => x.id !== game.id))
      navigate("/", { replace: true })
    } else {
      toast.error(result.message)
    }
    setIsDeleteModalOpen(false)
  }, [game, navigate, setFilteredGames])

  const handleLaunch = useCallback(async (): Promise<void> => {
    if (!game) return
    setIsLaunching(true)
    const result = await window.api.game.launchGame(game.exePath)
    if (result.success) {
      toast.success("ゲームを起動しました。")
    } else {
      toast.error(result.message)
    }
    setIsLaunching(false)
  }, [game])

  const handleUploadSaveData = useCallback(async (): Promise<void> => {
    if (!game || !game.saveFolderPath) {
      toast.error("セーブデータフォルダが設定されていません。")
      return
    }
    setIsUploading(true)
    const loadingToastId = toast.loading("セーブデータをアップロード中…")
    try {
      const remotePath = `games/${game.title}/save_data`
      const result = await window.api.saveData.upload.uploadSaveDataFolder(
        game.saveFolderPath,
        remotePath
      )
      if (result.success) {
        toast.success("セーブデータのアップロードに成功しました。", { id: loadingToastId })
      } else {
        toast.error(result.message, { id: loadingToastId })
      }
    } catch (error) {
      toast.error("セーブデータのアップロード中にエラーが発生しました。", { id: loadingToastId })
      console.error("Failed to upload save data:", error)
    } finally {
      setIsUploading(false)
    }
  }, [game])

  const handleDownloadSaveData = useCallback(async (): Promise<void> => {
    if (!game || !game.saveFolderPath) {
      toast.error("セーブデータフォルダが設定されていません。")
      return
    }
    setIsDownloading(true)
    const loadingToastId = toast.loading("セーブデータをダウンロード中…")
    try {
      const remotePath = `games/${game.title}/save_data`
      const result = await window.api.saveData.download.downloadSaveData(
        game.saveFolderPath,
        remotePath
      )
      if (result.success) {
        toast.success("セーブデータのダウンロードに成功しました。", { id: loadingToastId })
      } else {
        toast.error(result.message, { id: loadingToastId })
      }
    } catch (error) {
      toast.error("セーブデータのダウンロード中にエラーが発生しました。", { id: loadingToastId })
      console.error("Failed to download save data:", error)
    } finally {
      setIsDownloading(false)
    }
  }, [game])

  const handleUpdateGame = useCallback(
    async (values: InputGameData): Promise<ApiResult<void>> => {
      if (!game) return { success: false, message: "ゲームが見つかりません。" }
      const result = await window.api.database.updateGame(game.id, values)
      if (result.success) {
        toast.success("ゲーム情報を更新しました。")
        setFilteredGames((list) =>
          list.map((g) =>
            g.id === game.id
              ? { ...g, ...values } // 更新後の値をマージ
              : g
          )
        )
        setIsEditModalOpen(false)
      } else {
        toast.error(result.message)
      }
      return result
    },
    [game, setFilteredGames]
  )

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
          <div className="flex flex-col gap-4 mt-8">
            {/* １行目：実行ボタン */}
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="btn btn-primary btn-lg w-full h-12 flex items-center justify-center gap-2"
            >
              {isLaunching ? (
                <>
                  <IoIosPlay className="animate-spin text-2xl" />
                  <span className="text-lg">起動中…</span>
                </>
              ) : (
                <>
                  <IoIosPlay size={24} />
                  <span className="text-lg font-medium">ゲームを起動</span>
                </>
              )}
            </button>

            {/* ２行目：編集／解除 */}
            <div className="flex gap-2">
              <button className="btn btn-outline btn-md flex-1 h-10" onClick={openEdit}>
                <MdEdit /> 編集
              </button>
              <button
                className="btn btn-error btn-md flex-1 h-10"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <FaTrash /> 登録を解除
              </button>
            </div>

            {/* ３行目：アップロード／ダウンロード */}
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-md flex-1 h-10"
                onClick={handleUploadSaveData}
                disabled={isUploading || !game.saveFolderPath || !isValidCreds}
              >
                {isUploading ? (
                  <span className="loading loading-spinner">アップロード中…</span>
                ) : (
                  "アップロード"
                )}
              </button>
              <button
                className="btn btn-outline btn-md flex-1 h-10"
                onClick={handleDownloadSaveData}
                disabled={isDownloading || !game.saveFolderPath || !isValidCreds}
              >
                {isDownloading ? (
                  <span className="loading loading-spinner">ダウンロード中…</span>
                ) : (
                  "ダウンロード"
                )}
              </button>
            </div>
          </div>
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
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />

      {/* 編集 */}
      <GameFormModal
        mode="edit"
        initialData={editData}
        isOpen={isEditModalOpen}
        onSubmit={handleUpdateGame}
        onClose={closeEditModal}
      />
    </div>
  )
}
