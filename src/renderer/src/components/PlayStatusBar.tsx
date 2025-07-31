/**
 * @fileoverview プレイ状況バーコンポーネント
 *
 * このコンポーネントは、アプリケーション画面下部に現在のプレイ状況を表示します。
 *
 * 主な機能：
 * - 現在プレイ中のゲームの表示
 * - プレイ経過時間の表示
 * - プロセス監視の状態表示
 *
 * 使用例：
 * ```tsx
 * <PlayStatusBar />
 * ```
 */

import { autoTrackingAtom } from "@renderer/state/settings"
import { useAtom } from "jotai"
import React, { useEffect, useState } from "react"
import { FaClock, FaGamepad } from "react-icons/fa"

import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

import { logger } from "@renderer/utils/logger"

import type { MonitoringGameStatus } from "../../../types/game"

/**
 * プレイ状況バーコンポーネント
 *
 * アプリケーション画面下部に表示され、
 * 現在のプレイ状況を表示します。
 *
 * @returns プレイ状況バー要素
 */
export function PlayStatusBar(): React.JSX.Element {
  const [autoTracking] = useAtom(autoTrackingAtom)
  const [monitoringGames, setMonitoringGames] = useState<MonitoringGameStatus[]>([])
  const [, setCurrentTime] = useState<Date>(new Date())
  const { formatShort } = useTimeFormat()

  // 監視状況を更新
  const updateMonitoringStatus = React.useCallback(async (): Promise<void> => {
    // 自動ゲーム検出がOFFの場合は更新しない
    if (!autoTracking) {
      return
    }

    try {
      const status = await window.api.processMonitor.getMonitoringStatus()
      setMonitoringGames(status)
    } catch (error) {
      logger.error("監視状況の取得に失敗しました:", {
        component: "PlayStatusBar",
        function: "unknown",
        data: error
      })
    }
  }, [autoTracking])

  // 時間更新とステータス更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      updateMonitoringStatus()
    }, 1000)

    return () => clearInterval(interval)
  }, [updateMonitoringStatus])

  // 初期化
  useEffect(() => {
    // 少し遅延させて監視状態を取得（メインプロセスの初期化を待つ）
    const timer = setTimeout(() => {
      updateMonitoringStatus()
    }, 1000)

    return () => clearTimeout(timer)
  }, [updateMonitoringStatus])

  // 自動ゲーム検出がOFFの場合は非表示
  if (!autoTracking) {
    return <></>
  }

  const playingGames = monitoringGames.filter((game) => game.isPlaying)
  const hasPlayingGames = playingGames.length > 0

  return (
    <div className="bg-base-300 border-t border-base-content/10 px-4 py-1 h-12">
      <div className="flex items-center justify-between h-full">
        {/* 左側：プレイ状況 */}
        <div className="flex items-center gap-3">
          {hasPlayingGames ? (
            <>
              <FaGamepad className="text-primary text-sm" />
              <div className="flex flex-col justify-center">
                <div className="text-sm font-medium leading-tight">
                  プレイ中: {playingGames.map((game) => game.gameTitle).join(", ")}
                </div>
                <div className="text-xs text-base-content/70 leading-tight">
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
              <FaClock className="text-base-content/50 text-sm" />
              <div className="text-sm text-base-content/70">プレイ中のゲームはありません</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayStatusBar
