/**
 * @fileoverview プレイセッション管理カードコンポーネント
 *
 * プレイセッションの追加機能とプレイ統計を表示するカードコンポーネントです。
 * GitHub草風のヒートマップと組み合わせてプレイ活動を視覚化します。
 */

import { useState, useCallback, useEffect } from "react"
import { FaPlus, FaGamepad, FaClock, FaEdit, FaCog } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import PlayHeatmap from "./PlayHeatmap"
import { Chapter } from "../../../types/chapter"
import { PlaySessionType } from "src/types/game"

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
export default function PlaySessionCard({
  gameId,
  onAddSession,
  onSessionUpdated,
  onProcessManagement
}: PlaySessionCardProps): React.JSX.Element {
  const { formatSmart } = useTimeFormat()
  const [sessions, setSessions] = useState<PlaySessionType[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTime: 0,
    averageTime: 0,
    thisWeekTime: 0,
    thisMonthTime: 0
  })

  // プレイセッションデータを取得
  const fetchSessions = useCallback(async () => {
    if (!gameId) return

    try {
      setIsLoading(true)
      const result = await window.api.database.getPlaySessions(gameId)

      if (result.success && result.data) {
        setSessions(result.data)

        // 統計を計算
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const totalSessions = result.data.length
        const totalTime = result.data.reduce((sum, session) => sum + session.duration, 0)
        const averageTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0

        const thisWeekTime = result.data
          .filter((session) => new Date(session.playedAt) >= oneWeekAgo)
          .reduce((sum, session) => sum + session.duration, 0)

        const thisMonthTime = result.data
          .filter((session) => new Date(session.playedAt) >= oneMonthAgo)
          .reduce((sum, session) => sum + session.duration, 0)

        setStats({
          totalSessions,
          totalTime,
          averageTime,
          thisWeekTime,
          thisMonthTime
        })
      }
    } catch (error) {
      console.error("プレイセッション取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  // 章データを取得
  const fetchChapters = useCallback(async () => {
    if (!gameId) return

    try {
      const result = await window.api.chapter.getChapters(gameId)
      if (result.success && result.data) {
        setChapters(result.data.sort((a, b) => a.order - b.order))
      }
    } catch (error) {
      console.error("章データ取得エラー:", error)
    }
  }, [gameId])

  useEffect(() => {
    fetchSessions()
    fetchChapters()
  }, [fetchSessions, fetchChapters])

  // セッションの章を変更
  const updateSessionChapter = useCallback(
    async (sessionId: string, chapterId: string | null) => {
      try {
        const result = await window.api.database.updateSessionChapter(sessionId, chapterId)
        if (result.success) {
          // セッションデータを再取得
          await fetchSessions()
          setEditingSession(null)
          // 親コンポーネントに変更を通知
          onSessionUpdated?.()
        } else {
          console.error("セッション章変更エラー:", result.message)
        }
      } catch (error) {
        console.error("セッション章変更エラー:", error)
      }
    },
    [fetchSessions, onSessionUpdated]
  )

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
              プロセス管理
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

            {/* 最近のセッション */}
            {sessions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FaClock className="text-base-content/60" />
                  最近のセッション
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
                  {sessions
                    .slice(0, 10)
                    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex justify-between items-center bg-base-200 p-3 rounded text-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatSmart(session.duration)}</span>
                            <span className="text-base-content/60">
                              {new Date(session.playedAt).toLocaleDateString("ja-JP")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-base-content/60">章:</span>
                            {editingSession === session.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  className="select select-xs select-bordered"
                                  value={session.chapterId || ""}
                                  onChange={(e) =>
                                    updateSessionChapter(session.id, e.target.value || null)
                                  }
                                >
                                  <option value="">章を選択</option>
                                  {chapters.map((chapter) => (
                                    <option key={chapter.id} value={chapter.id}>
                                      {chapter.order}. {chapter.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => setEditingSession(null)}
                                >
                                  キャンセル
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{session.chapter?.name ?? "未設定"}</span>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => setEditingSession(session.id)}
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
