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
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-info",
    "bg-success",
    "bg-warning",
    "bg-error",
    "bg-neutral"
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

          <div className="w-full bg-base-300 rounded-full h-8 overflow-hidden flex">
            {chapterStats
              .sort((a, b) => a.order - b.order)
              .map((stat, index) => {
                const percentage = totalTime > 0 ? (stat.totalTime / totalTime) * 100 : 0
                const colorClass = colors[index % colors.length]

                return (
                  <div
                    key={stat.chapterId}
                    className={`${colorClass} h-full transition-all duration-300 group relative`}
                    style={{ width: `${percentage}%` }}
                    title={`${stat.chapterName}: ${formatSmart(stat.totalTime)} (${percentage.toFixed(1)}%)`}
                  >
                    {/* ホバー時のツールチップ効果 */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                )
              })}
          </div>
        </div>

        {/* 章別詳細情報 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-base-content/80 mb-3">章別詳細</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {chapterStats
              .sort((a, b) => a.order - b.order)
              .map((stat, index) => {
                const percentage = totalTime > 0 ? (stat.totalTime / totalTime) * 100 : 0
                const colorClass = colors[index % colors.length]

                return (
                  <div key={stat.chapterId} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-sm ${colorClass}`} />
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
