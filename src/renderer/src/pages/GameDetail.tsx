import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useAtomValue } from "jotai"
import { visibleGamesAtom } from "@renderer/state/home"
import DynamicImage from "@renderer/components/DynamicImage"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const filteredGames = useAtomValue(visibleGamesAtom)
  if (!id) return <Navigate to="/" replace />
  const gameId = Number(id)
  const game = filteredGames.find((g) => g.id === gameId)
  if (!game) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        ← 戻る
      </button>

      <div className="card card-side bg-base-100 shadow-xl p-6">
        {/* 左側のサムネイル */}
        <figure className="w-48 h-64 overflow-hidden rounded-lg">
          <DynamicImage
            src={game.imagePath ?? ""}
            alt={game.title}
            className="object-cover w-full h-full"
          />
        </figure>

        {/* 右側の本文 */}
        <div className="card-body pl-6">
          <h2 className="card-title text-3xl">{game.title}</h2>
          <p className="text-lg text-gray-700">{game.publisher}</p>

          <div className="card-actions mt-6 space-x-2">
            <button className="btn btn-primary gap-2">▶ ゲームを起動</button>
            <button className="btn btn-outline gap-2">✏ 編集</button>
            <button className="btn btn-error gap-2">🗑 登録を解除</button>
          </div>
        </div>
      </div>

      {/* ここに統計パネルやプレイ履歴カレンダーなどを追加 */}
    </div>
  )
}
