/**
 * @fileoverview プレイセッション管理カードコンポーネント
 *
 * プレイセッションの追加機能とプレイ統計を表示するカードコンポーネントです。
 * GitHub草風のヒートマップと組み合わせてプレイ活動を視覚化します。
 */

import { useState, useCallback, useEffect, useMemo, memo } from "react"
import { FaPlus, FaGamepad, FaCog } from "react-icons/fa"

import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

import PlayHeatmap from "./PlayHeatmap"
import type { PlaySessionType } from "src/types/game"

interface PlaySessionCardProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** プレイセッション追加のコールバック */
  onAddSession: () => void
  /** セッション更新時のコールバック */
  onSessionUpdated?: () => void
  /** プロセス管理を開くコールバック */
  onProcessManagement?: () => void
}

/**
 * プレイセッション管理カードコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns プレイセッションカードコンポーネント
 */
const PlaySessionCard = memo(function PlaySessionCard({
  gameId,
  onAddSession,
  onProcessManagement
}: PlaySessionCardProps): React.JSX.Element {
  const { formatSmart } = useTimeFormat()
  const [sessions, setSessions] = useState<PlaySessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 統計情報をメモ化して計算
  const stats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalSessions = sessions.length
    const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0)
    const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0

    const thisWeekTime = sessions
      .filter((session) => new Date(session.playedAt) >= oneWeekAgo)
      .reduce((sum, session) => sum + session.duration, 0)

    const thisMonthTime = sessions
      .filter((session) => new Date(session.playedAt) >= oneMonthAgo)
      .reduce((sum, session) => sum + session.duration, 0)

    return {
      totalSessions,
      totalTime,
      averageTime,
      thisWeekTime,
      thisMonthTime
    }
  }, [sessions])

  // プレイセッションデータを取得
  const fetchSessions = useCallback(async () => {
    if (!gameId) return

    try {
      setIsLoading(true)
      const result = await window.api.database.getPlaySessions(gameId)

      if (result.success && result.data) {
        setSessions(result.data)
      }
    } catch (error) {
      console.error("プレイセッション取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title flex items-center gap-2">
            <FaGamepad className="text-primary" />
            プレイセッション
          </h3>

          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={onProcessManagement}>
              <FaCog />
              セッション管理
            </button>
            <button className="btn btn-primary btn-sm" onClick={onAddSession}>
              <FaPlus />
              セッション追加
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <>
            {/* 統計情報 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">総セッション数</div>
                <div className="stat-value text-lg">{stats.totalSessions}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">総プレイ時間</div>
                <div className="stat-value text-lg">{formatSmart(stats.totalTime)}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">平均セッション</div>
                <div className="stat-value text-lg">{formatSmart(stats.averageTime)}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">今週のプレイ</div>
                <div className="stat-value text-lg">{formatSmart(stats.thisWeekTime)}</div>
              </div>
            </div>

            {/* プレイ活動ヒートマップ */}
            <div className="bg-base-200 p-4 rounded-lg">
              <PlayHeatmap sessions={sessions} gameId={gameId} />
            </div>
          </>
        )}
      </div>
    </div>
  )
})

export default PlaySessionCard
