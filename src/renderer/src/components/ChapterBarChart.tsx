/**
 * @fileoverview 章別プレイ統計を表示する棒グラフコンポーネント
 *
 * 単一の棒グラフに章の割合を表示し、章設定と章追加のボタンを提供します。
 * 各章のプレイ時間の割合を視覚的に確認できます。
 */

import { useEffect, useState } from "react"
import { FaChartBar } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import { ChapterStats } from "../../../types/chapter"

interface ChapterBarChartProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
}

function makeGradient(stats: { totalTime: number }[], colors: string[]): string {
  const total = stats.reduce((sum, s) => sum + s.totalTime, 0)
  let acc = 0
  const stops: string[] = []

  stats.forEach((s, idx) => {
    const pct = total > 0 ? (s.totalTime / total) * 100 : 0
    const start = acc
    const end = acc + pct
    stops.push(`${colors[idx % colors.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`)
    acc = end
  })

  return `linear-gradient(to right, ${stops.join(", ")})`
}

/**
 * 章別プレイ統計を表示する棒グラフコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns 章別統計グラフコンポーネント
 */
export default function ChapterBarChart({ gameId }: ChapterBarChartProps): React.JSX.Element {
  const { formatSmart } = useTimeFormat()
  const [chapterStats, setChapterStats] = useState<ChapterStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 章別統計データを取得
  useEffect(() => {
    const fetchChapterStats = async (): Promise<void> => {
      if (!gameId) return

      try {
        setIsLoading(true)
        const result = await window.api.chapter.getChapterStats(gameId)

        if (result.success && result.data) {
          setChapterStats(result.data)
        } else {
          console.error(
            "章別統計データの取得に失敗:",
            result.success ? "データが空です" : result.message
          )
          setChapterStats([])
        }
      } catch (error) {
        console.error("章別統計データの取得に失敗:", error)
        setChapterStats([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapterStats()
  }, [gameId])

  // 総プレイ時間を計算
  const totalTime = chapterStats.reduce((sum, stat) => sum + stat.totalTime, 0)

  const hasData = totalTime > 0

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        </div>
      </div>
    )
  }

  if (chapterStats.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaChartBar className="text-info" />
              <h3 className="card-title">章別プレイ統計</h3>
            </div>
          </div>
          <div className="text-center text-base-content/60 py-8">
            <p>章別データがありません</p>
            <p className="text-sm mt-2">「章追加」ボタンから章を作成してください</p>
          </div>
        </div>
      </div>
    )
  }

  // 色の配列（章ごとに異なる色を使用）
  // 多彩な色を使用してセッションバーを見やすく
  const chapterColors = [
    "#3B82F6", // Blue 500
    "#10B981", // Emerald 500
    "#F59E0B", // Amber 500
    "#EF4444", // Red 500
    "#8B5CF6", // Violet 500
    "#EC4899", // Pink 500
    "#06B6D4", // Cyan 500
    "#84CC16", // Lime 500
    "#F97316", // Orange 500
    "#6366F1", // Indigo 500
    "#14B8A6", // Teal 500
    "#A855F7", // Purple 500
    "#F43F5E", // Rose 500
    "#22C55E", // Green 500
    "#FBBF24", // Yellow 500
    "#8B5A2B", // Brown 500
    "#6B7280", // Gray 500
    "#DC2626", // Red 600
    "#059669", // Emerald 600
    "#D97706" // Amber 600
  ]

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaChartBar className="text-info" />
            <h3 className="card-title">章別プレイ統計</h3>
          </div>
        </div>
        {/* 単一の棒グラフ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">総プレイ時間の章別割合</span>
            <span className="text-sm text-base-content/60">{formatSmart(totalTime)}</span>
          </div>
          <div
            className="w-full h-8 rounded-full overflow-hidden bg-base-300"
            style={
              hasData
                ? {
                    background: makeGradient(chapterStats, chapterColors)
                  }
                : {}
            }
            title="章別プレイ時間割合"
          />
        </div>

        {/* 章別詳細情報 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-base-content/80 mb-3">章別詳細</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {chapterStats
              .sort((a, b) => a.order - b.order)
              .map((stat, index) => {
                const percentage = totalTime > 0 ? (stat.totalTime / totalTime) * 100 : 0
                const color = chapterColors[index % chapterColors.length]

                return (
                  <div key={stat.chapterId} className="flex items-center gap-2 text-sm">
                    <div className={"w-3 h-3 rounded-sm"} style={{ backgroundColor: color }} />
                    <span className="font-medium min-w-0 flex-shrink truncate">
                      {stat.chapterName}
                    </span>
                    <span className="text-base-content/60 text-xs ml-auto">
                      {formatSmart(stat.totalTime)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
