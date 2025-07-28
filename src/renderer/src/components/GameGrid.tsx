/**
 * @fileoverview ゲーム一覧グリッドコンポーネント
 *
 * このコンポーネントは、ゲームカードをグリッド形式で表示します。
 * 主な機能：
 * - レスポンシブグリッドレイアウト
 * - 仮想化による大量データ対応（将来的な拡張）
 * - ゲーム起動ハンドラーの最適化
 * - メモ化による再レンダリング防止
 */

import { memo } from "react"

import GameCard from "./GameCard"
import type { GameType } from "src/types/game"

interface GameGridProps {
  /** ゲーム一覧 */
  games: GameType[]
  /** ゲーム起動ハンドラ */
  onLaunchGame: (exePath: string) => void
}

/**
 * ゲーム一覧グリッドコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns ゲーム一覧グリッド要素
 */
const GameGrid = memo(function GameGrid({ games, onLaunchGame }: GameGridProps): React.JSX.Element {
  if (games.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="text-center text-base-content/50">
          <p className="text-lg mb-2">ゲームが見つかりませんでした</p>
          <p className="text-sm">検索条件を変更するか、新しいゲームを追加してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-transparent min-h-0">
      <div className="relative">
        <div
          className="grid gap-4 justify-center px-6 pb-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, 220px)" }}
        >
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              title={game.title}
              publisher={game.publisher}
              imagePath={game.imagePath || ""}
              exePath={game.exePath}
              onLaunchGame={onLaunchGame}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default GameGrid
