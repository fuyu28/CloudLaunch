/**
 * @fileoverview Github草風のプレイ統計ヒートマップコンポーネント
 *
 * プレイセッションの頻度を視覚的にGitHub草のような形式で表示します。
 * 過去1年間のプレイ活動を日ごとに色分けして表示し、
 * プレイ頻度の高い日ほど濃い色で表示されます。
 */

import { useMemo } from "react"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

interface PlaySession {
  id: string
  duration: number
  playedAt: string
  gameId: string
}

interface PlayHeatmapProps {
  /** プレイセッションデータの配列 */
  sessions: PlaySession[]
  /** ゲームID（フィルタリング用） */
  gameId: string
}

interface DayData {
  date: Date
  sessions: number
  totalTime: number
  isCurrentMonth: boolean
}

/**
 * Github草風のプレイ統計ヒートマップコンポーネント
 *
 * @param sessions - プレイセッションデータの配列
 * @param gameId - 対象ゲームのID
 * @returns ヒートマップコンポーネント
 */
export default function PlayHeatmap({ sessions, gameId }: PlayHeatmapProps): React.JSX.Element {
  const { formatSmart } = useTimeFormat()

  // 過去1年間の日付データを生成
  const heatmapData = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // ゲーム固有のセッションをフィルタリング
    const gameSessions = sessions.filter((session) => session.gameId === gameId)

    // 日付ごとのセッションデータを集計
    const sessionsByDate = gameSessions.reduce(
      (acc, session) => {
        const date = new Date(session.playedAt).toDateString()
        if (!acc[date]) {
          acc[date] = { sessions: 0, totalTime: 0 }
        }
        acc[date].sessions += 1
        acc[date].totalTime += session.duration
        return acc
      },
      {} as Record<string, { sessions: number; totalTime: number }>
    )

    // 1年間の全日付を生成
    const days: DayData[] = []
    const currentDate = new Date(oneYearAgo)

    while (currentDate <= today) {
      const dateStr = currentDate.toDateString()
      const sessionData = sessionsByDate[dateStr] || { sessions: 0, totalTime: 0 }

      days.push({
        date: new Date(currentDate),
        sessions: sessionData.sessions,
        totalTime: sessionData.totalTime,
        isCurrentMonth: currentDate.getMonth() === today.getMonth()
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }, [sessions, gameId])

  // 強度レベルを計算（0-4の5段階）
  const getIntensity = (sessions: number, totalTime: number): number => {
    if (sessions === 0) return 0
    if (sessions >= 3 || totalTime >= 7200) return 4 // 3回以上または2時間以上
    if (sessions >= 2 || totalTime >= 3600) return 3 // 2回以上または1時間以上
    if (sessions >= 1 || totalTime >= 1800) return 2 // 1回以上または30分以上
    return 1 // その他
  }

  // 強度に応じたCSSクラスを取得
  const getIntensityClass = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return "bg-base-300"
      case 1:
        return "bg-success bg-opacity-20"
      case 2:
        return "bg-success bg-opacity-40"
      case 3:
        return "bg-success bg-opacity-60"
      case 4:
        return "bg-success bg-opacity-80"
      default:
        return "bg-base-300"
    }
  }

  // 週ごとにグループ化
  const weeks = useMemo(() => {
    const result: DayData[][] = []
    let currentWeek: DayData[] = []

    heatmapData.forEach((day, index) => {
      if (index % 7 === 0 && currentWeek.length > 0) {
        result.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(day)
    })

    if (currentWeek.length > 0) {
      result.push(currentWeek)
    }

    return result
  }, [heatmapData])

  // 月ラベルを生成
  const monthLabels = useMemo(() => {
    const labels: string[] = []
    const today = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      labels.push(date.toLocaleDateString("ja-JP", { month: "short" }))
    }

    return labels
  }, [])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">プレイ活動</h3>
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          <span>少ない</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityClass(level)}`} />
            ))}
          </div>
          <span>多い</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 月ラベル */}
          <div className="flex mb-2">
            {monthLabels.map((month, index) => (
              <div
                key={index}
                className="flex-1 text-xs text-base-content/60 text-center min-w-[30px]"
              >
                {month}
              </div>
            ))}
          </div>

          {/* ヒートマップグリッド */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.sessions, day.totalTime)
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110 ${getIntensityClass(intensity)}`}
                      title={`${day.date.toLocaleDateString("ja-JP")}: ${day.sessions}回プレイ, ${formatSmart(day.totalTime)}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* 曜日ラベル */}
          <div className="flex mt-2">
            <div className="flex flex-col gap-1 text-xs text-base-content/60">
              <div className="h-3"></div>
              <div>月</div>
              <div className="h-3"></div>
              <div>水</div>
              <div className="h-3"></div>
              <div>金</div>
              <div className="h-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
