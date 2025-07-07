/**
 * @fileoverview Github草風のプレイ統計ヒートマップコンポーネント
 *
 * プレイセッションの頻度を視覚的にGitHub草のような形式で表示します。
 * 過去1年間のプレイ活動を日ごとに色分けして表示し、
 * プレイ頻度の高い日ほど濃い色で表示されます。
 */

import { useMemo } from "react"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import { PlaySessionType } from "src/types/game"

interface PlayHeatmapProps {
  /** プレイセッションデータの配列 */
  sessions: PlaySessionType[]
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
        return "bg-success/20"
      case 2:
        return "bg-success/40"
      case 3:
        return "bg-success/60"
      case 4:
        return "bg-success/80"
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

  const monthForWeek = weeks.map((week) =>
    week[0].date.toLocaleDateString("ja-JP", { month: "short" })
  )

  return (
    <div className="w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
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

      {/* ■ Grid コンテナ 定義 ■ */}
      <div
        className="grid gap-1"
        style={{
          // 1行目：月ラベル、2〜8行目：日曜日〜土曜日
          gridTemplateRows: "auto repeat(7, min-content)",
          gridTemplateColumns: `repeat(${weeks.length}, min-content)`
        }}
      >
        {/* ─── 1行目：月ラベル ─── */}
        {monthForWeek.map((month, col) => (
          <div
            key={col}
            className="text-xs text-base-content/60 text-center"
            style={{ gridRow: 1, gridColumn: col + 1 }}
          >
            {/* 先週と同じ月なら空文字 */}
            {col === 0 || monthForWeek[col] !== monthForWeek[col - 1] ? month : ""}
          </div>
        ))}

        {/* ─── 2〜8行目：セル ─── */}
        {weeks.map((week, col) =>
          week.map((day, weekday) => {
            const intensity = getIntensity(day.sessions, day.totalTime)
            return (
              <div
                key={`${col}-${weekday}`}
                className={`
                  w-3 h-3 rounded-sm cursor-pointer
                  transition-all hover:scale-110
                  ${getIntensityClass(intensity)}
                `}
                title={`${day.date.toLocaleDateString(
                  "ja-JP"
                )}: ${day.sessions}回, ${formatSmart(day.totalTime)}`}
                style={{
                  // gridColumn: 週番号＋1、gridRow: 曜日(0=日曜)＋2行目以降
                  gridColumn: col + 1,
                  gridRow: weekday + 2
                }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
