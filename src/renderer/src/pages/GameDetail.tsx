import { useState } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtom } from "jotai"
import { IoIosPlay } from "react-icons/io"
import { MdEdit } from "react-icons/md"
import { FaTrash } from "react-icons/fa"
import { FaArrowLeftLong } from "react-icons/fa6"
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editData, setEditData] = useState<InputGameData | null>(null)

  if (!id) return <Navigate to="/" replace />
  const gameId = Number(id)
  const game = filteredGames.find((g) => g.id === gameId)
  if (!game) return <Navigate to="/" replace />

  const confirmDelete = async (): Promise<void> => {
    try {
      // DBから削除
      await window.api.database.deleteGame(gameId)
      // ゲーム一覧から削除 (一応)
      setFilteredGames((g) => g.filter((x) => x.id !== gameId))
      // Homeに戻る
      navigate("/", { replace: true })
    } catch (e) {
      console.error(e)
    } finally {
      // モーダルを閉じる
      setIsDeleteModalOpen(false)
    }
  }

  const handleUpdateGame = async (values: InputGameData): Promise<ApiResult> => {
    try {
      await window.api.database.updateGame(gameId, values)
      return { success: true }
    } catch (e) {
      console.error(e)
      return { success: false, message: `${e}` }
    }
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        <FaArrowLeftLong /> 戻る
      </button>

      <div className="card card-side bg-base-100 shadow-xl p-6">
        {/* 左側のサムネイル */}
        <figure className="w-100 h-64 flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
          <DynamicImage
            src={game.imagePath ?? ""}
            alt={game.imagePath ?? ""}
            className="max-w-full max-h-full object-contain text-black"
          />
        </figure>

        {/* 右側の本文 */}
        <div className="card-body pl-12">
          <h2 className="card-title text-3xl">{game.title}</h2>
          <p className="text-lg">{game.publisher}</p>

          <div className="card-actions mt-6 space-x-2">
            <button className="btn btn-primary gap-2">
              <IoIosPlay /> ゲームを起動
            </button>
            <button
              className="btn btn-outline gap-2"
              onClick={() => {
                setEditData({
                  title: game.title,
                  publisher: game.publisher,
                  imagePath: game.imagePath ?? "",
                  exePath: game.exePath,
                  saveFolderPath: game.saveFolderPath,
                  playStatus: game.playStatus
                })

                setIsEditModalOpen(true)
              }}
            >
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
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* 編集 */}
      <GameFormModal
        mode="edit"
        initialData={editData}
        isOpen={isEditModalOpen}
        onSubmit={handleUpdateGame}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  )
}
