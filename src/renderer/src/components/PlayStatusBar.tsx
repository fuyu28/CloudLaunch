/**
 * @fileoverview プレイ状況バーコンポーネント
 *
 * このコンポーネントは、アプリケーション画面下部に現在のプレイ状況を表示します。
 *
 * 主な機能：
 * - 現在プレイ中のゲームの表示
 * - プレイ経過時間の表示
 * - プロセス監視の状態表示
 * - 自動計測の開始・停止
 *
 * 使用例：
 * ```tsx
 * <PlayStatusBar />
 * ```
 */

import React, { useEffect, useState } from "react"
import { FaPlay, FaStop, FaClock, FaGamepad } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import type { MonitoringGameStatus } from "../../../types/game"

/**
 * プレイ状況バーコンポーネント
 *
 * アプリケーション画面下部に表示され、
 * 現在のプレイ状況と監視状態を表示します。
 *
 * @returns プレイ状況バー要素
 */
export function PlayStatusBar(): React.JSX.Element {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false)
  const [monitoringGames, setMonitoringGames] = useState<MonitoringGameStatus[]>([])
  const [, setCurrentTime] = useState<Date>(new Date())
  const { formatShort } = useTimeFormat()

  // 監視状況を更新
  const updateMonitoringStatus = async (): Promise<void> => {
    try {
      const status = await window.api.processMonitor.getMonitoringStatus()
      setMonitoringGames(status)
    } catch (error) {
      console.error("監視状況の取得に失敗しました:", error)
    }
  }

  // 監視開始
  const startMonitoring = async (): Promise<void> => {
    try {
      const result = await window.api.processMonitor.startMonitoring()
      if (result.success) {
        setIsMonitoring(true)
        await updateMonitoringStatus()
      }
    } catch (error) {
      console.error("監視開始に失敗しました:", error)
    }
  }

  // 監視停止
  const stopMonitoring = async (): Promise<void> => {
    try {
      const result = await window.api.processMonitor.stopMonitoring()
      if (result.success) {
        setIsMonitoring(false)
        setMonitoringGames([])
      }
    } catch (error) {
      console.error("監視停止に失敗しました:", error)
    }
  }

  // 時間更新とステータス更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (isMonitoring) {
        updateMonitoringStatus()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // 初期化
  useEffect(() => {
    updateMonitoringStatus()
  }, [])

  const playingGames = monitoringGames.filter((game) => game.isPlaying)
  const hasPlayingGames = playingGames.length > 0

  return (
    <div className="bg-base-300 border-t border-base-content/10 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* 左側：プレイ状況 */}
        <div className="flex items-center gap-4">
          {hasPlayingGames ? (
            <>
              <FaGamepad className="text-primary" />
              <div className="flex flex-col">
                <div className="text-sm font-medium">
                  プレイ中: {playingGames.map((game) => game.gameTitle).join(", ")}
                </div>
                <div className="text-xs text-base-content/70">
                  {playingGames.map((game) => (
                    <span key={game.gameId} className="mr-4">
                      {game.exeName}: {formatShort(game.playTime)}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <FaClock className="text-base-content/50" />
              <div className="text-sm text-base-content/70">
                {isMonitoring ? "監視中 - プレイ中のゲームはありません" : "監視停止中"}
              </div>
            </>
          )}
        </div>

        {/* 右側：監視コントロール */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-base-content/70">
            自動計測: {isMonitoring ? "ON" : "OFF"}
          </div>
          <button
            className={`btn btn-sm ${isMonitoring ? "btn-error" : "btn-primary"}`}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <FaStop className="mr-1" />
                停止
              </>
            ) : (
              <>
                <FaPlay className="mr-1" />
                開始
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayStatusBar
