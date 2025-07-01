import { useParams, useNavigate } from "react-router-dom"

export default function GameDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        ← 戻る
      </button>
      <div className="card bg-base-100 shadow-xl">
        <figure>
          <img src={`/assets/covers/${id}.jpg`} alt={`cover-${id}`} />
        </figure>
        <div className="card-body">
          <h2 className="card-title text-2xl">ゲームタイトル #{id}</h2>
          <p className="text-gray-600">開発元 / リリース日など</p>
          <div className="card-actions mt-4">
            <button className="btn btn-primary">ゲームを起動</button>
            <button className="btn btn-outline">編集</button>
            <button className="btn btn-error">登録を解除</button>
          </div>
        </div>
      </div>

      {/* ここに統計パネルやプレイ履歴カレンダーなどを追加 */}
    </div>
  )
}
