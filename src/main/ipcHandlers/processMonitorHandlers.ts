/**
 * @fileoverview プロセス監視に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのプロセス監視操作リクエストを処理します。
 * - 監視の開始・停止
 * - ゲームの監視対象への追加・削除
 * - 監視状況の取得
 *
 * ProcessMonitorServiceと連携して自動プレイ時間計測機能を提供します。
 */

import { ipcMain } from "electron"
import { ProcessMonitorService } from "../service/processMonitorService"
import { logger } from "../utils/logger"
import { ApiResult } from "../../types/result"

/**
 * プロセス監視関連のIPCハンドラーを登録
 */
export function registerProcessMonitorHandlers(): void {
  const monitor = ProcessMonitorService.getInstance()

  /**
   * プロセス監視を開始
   */
  ipcMain.handle("start-process-monitoring", async (): Promise<ApiResult> => {
    try {
      monitor.startMonitoring()
      return { success: true }
    } catch (error) {
      logger.error("プロセス監視開始エラー:", error)
      return { success: false, message: "プロセス監視の開始に失敗しました" }
    }
  })

  /**
   * プロセス監視を停止
   */
  ipcMain.handle("stop-process-monitoring", async (): Promise<ApiResult> => {
    try {
      monitor.stopMonitoring()
      return { success: true }
    } catch (error) {
      logger.error("プロセス監視停止エラー:", error)
      return { success: false, message: "プロセス監視の停止に失敗しました" }
    }
  })

  /**
   * ゲームを監視対象に追加
   */
  ipcMain.handle(
    "add-game-to-monitor",
    async (_event, gameId: string, gameTitle: string, exePath: string): Promise<ApiResult> => {
      try {
        monitor.addGame(gameId, gameTitle, exePath)
        return { success: true }
      } catch (error) {
        logger.error("ゲーム監視追加エラー:", error)
        return { success: false, message: "ゲーム監視の追加に失敗しました" }
      }
    }
  )

  /**
   * ゲームを監視対象から削除
   */
  ipcMain.handle("remove-game-from-monitor", async (_event, gameId: string): Promise<ApiResult> => {
    try {
      monitor.removeGame(gameId)
      return { success: true }
    } catch (error) {
      logger.error("ゲーム監視削除エラー:", error)
      return { success: false, message: "ゲーム監視の削除に失敗しました" }
    }
  })

  /**
   * 監視状況を取得
   */
  ipcMain.handle("get-monitoring-status", async () => {
    try {
      return monitor.getMonitoringStatus()
    } catch (error) {
      logger.error("監視状況取得エラー:", error)
      return []
    }
  })

  /**
   * 監視中かどうかをチェック
   */
  ipcMain.handle("is-monitoring", async (): Promise<boolean> => {
    try {
      return monitor.isMonitoring()
    } catch (error) {
      logger.error("監視状態チェックエラー:", error)
      return false
    }
  })
}
