import { useCallback, useState } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtom } from "jotai"
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

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filteredGames, setFilteredGames] = useAtom(visibleGamesAtom)

  const [isLaunching, setIsLaunching] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editData, setEditData] = useState<InputGameData | null>(null)

  const game = filteredGames.find((g) => g.id === Number(id))

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
    <div className="min-h-screen bg-base-200 p-6">
      <button onClick={handleBack} className="btn btn-ghost mb-4">
        <FaArrowLeftLong /> 戻る
      </button>

      <div className="card card-side bg-base-100 shadow-xl p-6">
        {/* 左側のサムネイル */}
        <figure className="w-[380px] h-64 flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
          <DynamicImage
            src={game.imagePath ?? ""}
            alt={game.title ?? ""}
            className="max-w-full max-h-full object-contain text-black"
          />
        </figure>

        {/* 右側の本文 */}
        <div className="card-body pl-12">
          <h2 className="card-title text-3xl">{game.title}</h2>
          <p className="text-lg">{game.publisher}</p>

          <div className="card-actions mt-6 space-x-2">
            <button className="btn btn-primary gap-2" onClick={handleLaunch} disabled={isLaunching}>
              {isLaunching ? (
                <>
                  <IoIosPlay className="animate-spin" />
                  起動中…
                </>
              ) : (
                <>
                  <IoIosPlay />
                  ゲームを起動
                </>
              )}
            </button>
            <button className="btn btn-outline gap-2" onClick={openEdit}>
              <MdEdit /> 編集
            </button>
            <button className="btn btn-error gap-2" onClick={() => setIsDeleteModalOpen(true)}>
              <FaTrash /> 登録を解除
            </button>
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
