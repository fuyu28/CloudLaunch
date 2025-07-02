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

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filteredGames, setFilteredGames] = useAtom(visibleGamesAtom)
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
      setIsModalOpen(false)
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
            <button className="btn btn-outline gap-2">
              <MdEdit /> 編集
            </button>
            <button className="btn btn-error gap-2" onClick={() => setIsModalOpen(true)}>
              <FaTrash /> 登録を解除
            </button>
          </div>
        </div>
      </div>

      {/* ここに統計パネルやプレイ履歴カレンダーなどを追加 */}

      {/* モーダル */}
      <ConfirmModal
        id="delete-game-modal"
        isOpen={isModalOpen}
        message={`${game.title} を削除しますか？\nこの操作は取り消せません`}
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={confirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  )
}
