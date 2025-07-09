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
import { prisma } from "../db"

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
      await monitor.startMonitoring()
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

  /**
   * 指定されたゲームのプロセス情報を取得
   */
  ipcMain.handle(
    "get-game-processes",
    async (
      _event,
      gameId: string
    ): Promise<
      ApiResult<
        Array<{
          id: string
          name: string
          duration: number
          playedAt: Date
          isLinked: boolean
        }>
      >
    > => {
      try {
        // プレイセッションからプロセス情報を取得
        const sessions = await prisma.playSession.findMany({
          where: { gameId },
          orderBy: { playedAt: "desc" }
        })

        // 現在監視中のプロセスをチェック
        const processData = sessions.map((session) => ({
          id: session.id,
          name: session.sessionName || "未設定",
          duration: session.duration,
          playedAt: session.playedAt,
          isLinked: false // セッション名ベースでは連携状態は判定しない
        }))

        return { success: true, data: processData }
      } catch (error) {
        logger.error("ゲームプロセス情報取得エラー:", error)
        return { success: false, message: "プロセス情報の取得に失敗しました" }
      }
    }
  )

  /**
   * プロセス（プレイセッション）を削除
   */
  ipcMain.handle("delete-process", async (_event, processId: string): Promise<ApiResult> => {
    try {
      const session = await prisma.playSession.findUnique({
        where: { id: processId },
        include: { game: true }
      })

      if (!session) {
        return { success: false, message: "プロセスが見つかりません" }
      }

      // プレイセッションを削除
      await prisma.playSession.delete({
        where: { id: processId }
      })

      // ゲームの総プレイ時間を更新
      await prisma.game.update({
        where: { id: session.gameId },
        data: {
          totalPlayTime: { decrement: session.duration }
        }
      })

      return { success: true }
    } catch (error) {
      logger.error("プロセス削除エラー:", error)
      return { success: false, message: "プロセスの削除に失敗しました" }
    }
  })

  /**
   * 連携先プロセスを設定
   */
  ipcMain.handle(
    "set-linked-process",
    async (_event, gameId: string, processId: string): Promise<ApiResult> => {
      try {
        const session = await prisma.playSession.findUnique({
          where: { id: processId }
        })

        if (!session) {
          return { success: false, message: "プロセスが見つかりません" }
        }

        const game = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!game) {
          return { success: false, message: "ゲームが見つかりません" }
        }

        // 現在の監視対象から削除
        monitor.removeGame(gameId)

        // セッションのプロセス名を基に実行パスを構築
        // 実際のゲームの実行パスを使用し、プロセス名は参考程度に
        const exePath = game.exePath

        // 監視対象に追加（実際のexePathを使用）
        monitor.addGame(gameId, game.title, exePath)

        return { success: true }
      } catch (error) {
        logger.error("連携先プロセス設定エラー:", error)
        return { success: false, message: "連携先プロセスの設定に失敗しました" }
      }
    }
  )
}
