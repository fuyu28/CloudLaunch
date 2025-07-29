/**
 * @fileoverview プロセス監視関連のpreload API
 *
 * このファイルは、プロセス監視機能のプリロードAPIを定義します。
 * - 監視の開始・停止
 * - ゲームの監視対象追加・削除
 * - 監視状況の取得
 */

import { ipcRenderer } from "electron"

import type { ApiResult } from "../../types/result"

/**
 * 監視中のゲーム情報
 */
export type MonitoringGameStatus = {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** 実行ファイル名 */
  exeName: string
  /** プレイ中かどうか */
  isPlaying: boolean
  /** プレイ時間（秒） */
  playTime: number
}

/**
 * プロセス監視API
 */
export const processMonitorAPI = {
  /**
   * プロセス監視を開始
   * @returns 処理結果
   */
  startMonitoring: (): Promise<ApiResult> => ipcRenderer.invoke("start-process-monitoring"),

  /**
   * プロセス監視を停止
   * @returns 処理結果
   */
  stopMonitoring: (): Promise<ApiResult> => ipcRenderer.invoke("stop-process-monitoring"),

  /**
   * ゲームを監視対象に追加
   * @param gameId ゲームID
   * @param gameTitle ゲームタイトル
   * @param exePath 実行ファイルパス
   * @returns 処理結果
   */
  addGameToMonitor: (gameId: string, gameTitle: string, exePath: string): Promise<ApiResult> =>
    ipcRenderer.invoke("add-game-to-monitor", gameId, gameTitle, exePath),

  /**
   * ゲームを監視対象から削除
   * @param gameId ゲームID
   * @returns 処理結果
   */
  removeGameFromMonitor: (gameId: string): Promise<ApiResult> =>
    ipcRenderer.invoke("remove-game-from-monitor", gameId),

  /**
   * 監視状況を取得
   * @returns 監視中のゲーム情報の配列
   */
  getMonitoringStatus: (): Promise<MonitoringGameStatus[]> =>
    ipcRenderer.invoke("get-monitoring-status"),

  /**
   * 監視中かどうかをチェック
   * @returns 監視中かどうか
   */
  isMonitoring: (): Promise<boolean> => ipcRenderer.invoke("is-monitoring"),

  /**
   * 指定されたゲームのプロセス情報を取得
   * @param gameId ゲームID
   * @returns プロセス情報の配列
   */
  getGameProcesses: (
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
  > => ipcRenderer.invoke("get-game-processes", gameId),

  /**
   * プロセス（プレイセッション）を削除
   * @param processId プロセスID
   * @returns 処理結果
   */
  deleteProcess: (processId: string): Promise<ApiResult> =>
    ipcRenderer.invoke("delete-process", processId),

  /**
   * 連携先プロセスを設定
   * @param gameId ゲームID
   * @param processId プロセスID
   * @returns 処理結果
   */
  setLinkedProcess: (gameId: string, processId: string): Promise<ApiResult> =>
    ipcRenderer.invoke("set-linked-process", gameId, processId)
}
