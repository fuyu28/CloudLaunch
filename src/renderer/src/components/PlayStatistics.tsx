/**
 * @fileoverview プレイ統計コンポーネント
 *
 * このコンポーネントは、プレイセッション管理と章別プレイ統計を統合したセクションを提供します。
 * 主な機能：
 * - プレイセッション履歴表示
 * - 章別プレイ統計グラフ
 * - プレイセッション追加・管理
 * - 章データ管理
 */

import { memo } from "react"
import { FaPlus, FaCog } from "react-icons/fa"

import ChapterBarChart from "./ChapterBarChart"
import PlaySessionCardSimple from "./PlaySessionCardSimple"
import type { GameType } from "src/types/game"

type PlayStatisticsProps = {
  /** ゲーム情報 */
  game: GameType
  /** 更新キー（データ再取得トリガー） */
  refreshKey: number
  /** プレイセッション追加ハンドラ */
  onAddPlaySession: () => void
  /** プロセス管理モーダル開く */
  onOpenProcessManagement: () => void
}

/**
 * プレイ統計コンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns プレイ統計要素
 */
const PlayStatistics = memo(function PlayStatistics({
  game,
  refreshKey,
  onAddPlaySession,
  onOpenProcessManagement
}: PlayStatisticsProps): React.JSX.Element {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h2 className="card-title text-xl">プレイ統計</h2>
          </div>
          {/* セッション管理ボタン */}
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm gap-2 hover:bg-base-300 transition-colors"
              onClick={onOpenProcessManagement}
            >
              <FaCog className="text-base-content/70" />
              管理
            </button>
            <button
              className="btn btn-primary btn-sm gap-2 shadow-md hover:shadow-lg transition-shadow"
              onClick={onAddPlaySession}
            >
              <FaPlus />
              追加
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* プレイセッション管理 */}
          <PlaySessionCardSimple
            key={`play-session-${refreshKey}`}
            gameId={game.id}
            gameTitle={game.title}
            hiddenButtons={true}
          />

          {/* 章別プレイ統計グラフ */}
          <ChapterBarChart
            key={`chapter-chart-${refreshKey}`}
            gameId={game.id}
            gameTitle={game.title}
          />
        </div>
      </div>
    </div>
  )
})

export default PlayStatistics
