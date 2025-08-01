/**
 * @fileoverview シンプルなプレイセッションカードコンポーネント
 *
 * プレイ統計セクション用に簡略化されたプレイセッション表示コンポーネントです。
 * タイトルやカード装飾を除去し、統合されたレイアウトに適合します。
 */

import { useState, useCallback, useEffect, useMemo, memo } from "react"
import { subWeeks } from "date-fns"
import { FaPlus, FaCog, FaGamepad, FaClock, FaChartLine, FaCalendarWeek } from "react-icons/fa"

import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

import { logger } from "@renderer/utils/logger"

import type { PlaySessionType } from "src/types/game"

type PlaySessionCardSimpleProps = {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** プレイセッション追加のコールバック */
  onAddSession?: () => void
  /** セッション更新時のコールバック */
  onSessionUpdated?: () => void
  /** プロセス管理を開くコールバック */
  onProcessManagement?: () => void
  /** ボタンを非表示にするフラグ */
  hiddenButtons?: boolean
}

/**
 * シンプルなプレイセッション管理コンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns プレイセッション管理要素
 */
const PlaySessionCardSimple = memo(function PlaySessionCardSimple({
  gameId,
  onAddSession,
  onProcessManagement,
  hiddenButtons = false
}: PlaySessionCardSimpleProps): React.JSX.Element {
  const { formatSmart } = useTimeFormat()
  const [sessions, setSessions] = useState<PlaySessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 統計情報をメモ化して計算
  const stats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = subWeeks(now, 1)

    const totalSessions = sessions.length
    const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0)
    const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0

    const thisWeekSessions = sessions.filter((session) => new Date(session.playedAt) >= oneWeekAgo)
    const thisWeekTime = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0)

    return {
      totalSessions,
      totalTime,
      averageTime,
      thisWeekTime
    }
  }, [sessions])

  // プレイセッションを取得
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await window.api.database.getPlaySessions(gameId)
      if (result.success && result.data) {
        setSessions(result.data)
      }
    } catch (error) {
      logger.error("プレイセッションの取得に失敗:", {
        component: "PlaySessionCardSimple",
        function: "unknown",
        data: error
      })
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return (
    <div className="card bg-base-200 rounded-lg shadow-sm">
      <div className="card-body p-4">
        {/* アクションボタン */}
        {!hiddenButtons && (
          <div className="flex gap-3 justify-end mb-4">
            <button
              className="btn btn-outline btn-sm gap-2 hover:bg-base-300 transition-colors"
              onClick={onProcessManagement}
            >
              <FaCog className="text-base-content/70" />
              管理
            </button>
            <button
              className="btn btn-primary btn-sm gap-2 shadow-md hover:shadow-lg transition-shadow"
              onClick={onAddSession}
            >
              <FaPlus />
              追加
            </button>
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 総セッション */}
            <div className="card bg-white rounded-xl shadow-sm">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaGamepad className="text-accent text-xs" />
                  <div className="text-xs font-medium text-base-content/70">総セッション</div>
                </div>
                <div className="text-base font-bold text-base-content">{stats.totalSessions}</div>
              </div>
            </div>

            {/* 総時間 */}
            <div className="card bg-white rounded-xl shadow-sm">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaClock className="text-primary text-xs" />
                  <div className="text-xs font-medium text-base-content/70">総時間</div>
                </div>
                <div className="text-base font-bold text-base-content">
                  {formatSmart(stats.totalTime)}
                </div>
              </div>
            </div>

            {/* 平均時間 */}
            <div className="card bg-white rounded-xl shadow-sm">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaChartLine className="text-secondary text-xs" />
                  <div className="text-xs font-medium text-base-content/70">平均時間</div>
                </div>
                <div className="text-base font-bold text-base-content">
                  {formatSmart(stats.averageTime)}
                </div>
              </div>
            </div>

            {/* 今週 */}
            <div className="card bg-white rounded-xl shadow-sm">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarWeek className="text-info text-xs" />
                  <div className="text-xs font-medium text-base-content/70">今週</div>
                </div>
                <div className="text-base font-bold text-base-content">
                  {formatSmart(stats.thisWeekTime)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default PlaySessionCardSimple
