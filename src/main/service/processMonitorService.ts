/**
 * @fileoverview プロセス監視サービス
 *
 * このサービスは、ゲームの実行プロセスを監視し、プレイ時間を自動計測します。
 *
 * 主な機能：
 * - ネイティブコマンド（PowerShell/ps）とps-listによるプロセス監視
 * - 10秒間のプロセスキャッシュによる効率化（最大1000件制限）
 * - Unicode正規化による日本語ゲーム対応
 * - ゲームの実行状態の検知と自動監視対象追加
 * - 自動プレイセッションの記録
 * - プロセス状態の変更通知
 *
 * 使用例：
 * ```typescript
 * const monitor = ProcessMonitorService.getInstance()
 * monitor.startMonitoring()
 * monitor.addGame(gameId, exePath)
 * ```
 */

import path from "path"
import { EventEmitter } from "events"
import Store from "electron-store"
import psList from "ps-list"
import { parse } from "csv-parse/sync"
import { prisma } from "../db"
import { logger } from "../utils/logger"
import { exec } from "child_process"
import * as iconv from "iconv-lite"
import { promisify } from "util"

const execAsync = promisify(exec)

/**
 * 監視対象のゲーム情報
 */
interface MonitoredGame {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** 実行ファイルパス */
  exePath: string
  /** 実行ファイル名 */
  exeName: string
  /** 最後に検知された時刻 */
  lastDetected?: Date
  /** プレイ開始時刻 */
  playStartTime?: Date
  /** 累積プレイ時間（秒） */
  accumulatedTime: number
  /** 最後にプロセスが見つからなかった時刻 */
  lastNotFound?: Date
}

/**
 * プロセス監視サービス
 *
 * ゲームの実行プロセスを監視し、プレイ時間を自動計測します。
 * シングルトンパターンで実装されており、アプリケーション全体で1つのインスタンスを共有します。
 */
export class ProcessMonitorService extends EventEmitter {
  private static instance: ProcessMonitorService | undefined = undefined
  private monitoredGames: Map<string, MonitoredGame> = new Map()
  private monitoringInterval: NodeJS.Timeout | undefined = undefined
  private readonly intervalMs: number = 2000 // 2秒間隔で監視
  private readonly sessionTimeoutMs: number = 4000 // 4秒間プロセスが見つからなかったらセッション終了
  private readonly gameCleanupTimeoutMs: number = 20000 // 20秒間プロセスが見つからない場合に監視対象から削除
  private store: Store = new Store() // 設定ストア

  /**
   * ProcessMonitorServiceのコンストラクタ
   * プライベートコンストラクタでシングルトンパターンを実装
   */
  private constructor() {
    super()
  }

  /**
   * ProcessMonitorServiceのインスタンスを取得
   * @returns ProcessMonitorServiceのインスタンス
   */
  public static getInstance(): ProcessMonitorService {
    if (!ProcessMonitorService.instance) {
      ProcessMonitorService.instance = new ProcessMonitorService()
    }
    return ProcessMonitorService.instance
  }

  private addGameInternal(gameId: string, gameTitle: string, exePath: string): void {
    const exeName = path.basename(exePath)
    const game: MonitoredGame = {
      gameId,
      gameTitle,
      exePath,
      exeName,
      accumulatedTime: 0
    }
    this.monitoredGames.set(gameId, game)
    logger.info(`（内部）ゲーム監視を追加: ${gameTitle} (${exeName}, ID: ${gameId})`)
  }

  /**
   * 自動ゲーム検出設定を更新（リアルタイムで反映）
   * @param enabled 自動ゲーム検出の有効/無効
   */
  public updateAutoTracking(enabled: boolean): void {
    this.store.set("autoTracking", enabled)

    // 設定変更を有効にした場合、即座にプロセスチェックを実行
    if (enabled && this.isMonitoring()) {
      this.checkProcesses().catch((error) => {
        logger.error("即座プロセスチェックでエラーが発生しました:", error)
      })
    }
  }

  /**
   * 現在の自動ゲーム検出設定を取得
   * @returns 自動ゲーム検出の有効/無効
   */
  public getAutoTracking(): boolean {
    return this.store.get("autoTracking", true) as boolean
  }

  /**
   * 監視を開始
   */
  public async startMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      logger.info("プロセス監視は既に開始されています")
      return
    }

    logger.info("プロセス監視を開始します")

    // 起動時の自動ゲーム検出設定を確認
    const autoTracking = this.store.get("autoTracking", true) as boolean
    logger.info(`自動ゲーム検出: ${autoTracking ? "有効" : "無効"}`)

    // 開始時に即座にプロセスチェックを実行（自動追加も含む）
    this.checkProcesses()

    this.monitoringInterval = setInterval(() => {
      this.checkProcesses()
    }, this.intervalMs)

    // アプリケーション終了時に監視を停止
    process.on("beforeExit", () => {
      this.stopMonitoring()
    })
  }

  /**
   * 監視が開始されているかチェック
   * @returns 監視中かどうか
   */
  public isMonitoring(): boolean {
    return this.monitoringInterval !== undefined
  }

  /**
   * 監視を停止
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      logger.info("プロセス監視を停止しました")
    }

    // 進行中のセッションを保存
    this.saveAllActiveSessions()
  }

  /**
   * ゲームを監視対象に追加（手動追加用）
   * @param gameId ゲームID
   * @param gameTitle ゲームタイトル
   * @param exePath 実行ファイルパス
   */
  public addGame(gameId: string, gameTitle: string, exePath: string): void {
    const exeName = path.basename(exePath)
    const game: MonitoredGame = {
      gameId,
      gameTitle,
      exePath,
      exeName,
      accumulatedTime: 0
    }

    this.monitoredGames.set(gameId, game)
    logger.info(`ゲーム監視を追加: ${gameTitle} (${exeName}, ID: ${gameId})`)
  }

  /**
   * ゲームを監視対象から削除
   * @param gameId ゲームID
   */
  public removeGame(gameId: string): void {
    const game = this.monitoredGames.get(gameId)
    if (game) {
      // 進行中のセッションがあれば保存
      if (game.playStartTime) {
        this.saveSession(game)
      }
      this.monitoredGames.delete(gameId)
      logger.info(`ゲーム監視を削除: ${game.exeName} (ID: ${gameId})`)
    }
  }

  /**
   * 現在の監視状況を取得
   * @returns 監視中のゲーム情報
   */
  public getMonitoringStatus(): Array<{
    gameId: string
    gameTitle: string
    exeName: string
    isPlaying: boolean
    playTime: number
  }> {
    const status = Array.from(this.monitoredGames.values()).map((game) => ({
      gameId: game.gameId,
      gameTitle: game.gameTitle,
      exeName: game.exeName,
      isPlaying: !!game.playStartTime,
      playTime:
        game.accumulatedTime +
        (game.playStartTime ? Math.floor((Date.now() - game.playStartTime.getTime()) / 1000) : 0)
    }))

    return status
  }

  /**
   * ゲームプロセスが実行中かチェック
   * @param gameExeName ゲーム実行ファイル名
   * @param gameExePath ゲーム実行ファイルパス
   * @param processes プロセス一覧
   * @returns プロセスが実行中かどうか
   */
  private isGameProcessRunning(
    gameExeName: string,
    gameExePath: string,
    processes: Array<{ name?: string; pid: number; cmd?: string }>
  ): boolean {
    // 正規化処理を一元化
    const normalizedGameExeName = gameExeName.toLowerCase().normalize("NFC")
    const normalizedGameExePath = gameExePath.toLowerCase().normalize("NFC")

    // プロセス一覧をチェック
    for (const process of processes) {
      if (!process.name || !process.cmd) continue

      const normalizedProcessName = process.name.toLowerCase().normalize("NFC")
      const normalizedProcessCmd = process.cmd.toLowerCase().normalize("NFC")

      // プロセス名が一致する場合のみパスチェック
      if (normalizedProcessName === normalizedGameExeName) {
        // 1. 完全パス一致チェック
        if (normalizedProcessCmd === normalizedGameExePath) {
          return true
        }

        // 2. パス包含チェック（双方向）
        if (
          normalizedProcessCmd.includes(normalizedGameExePath) ||
          normalizedGameExePath.includes(normalizedProcessCmd)
        ) {
          return true
        }

        // 3. ディレクトリ部分一致チェック
        const gameDirectory = path.dirname(normalizedGameExePath).toLowerCase().normalize("NFC")
        if (normalizedProcessCmd.includes(gameDirectory)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * プロセスをチェック
   */
  private async checkProcesses(): Promise<void> {
    try {
      let processes: Array<{ name?: string; pid: number; cmd?: string }> = []

      try {
        // まずネイティブコマンドを試す
        processes = await this.getProcessesNative()
      } catch (error) {
        // ネイティブコマンドが失敗した場合はps-listをフォールバックとして使用
        logger.warn(
          "ネイティブコマンドが失敗しました。ps-listをフォールバックとして使用します",
          error
        )
        try {
          processes = await psList()
        } catch (fallbackError) {
          logger.error("ps-listもフォールバックとして失敗しました:", fallbackError)
          processes = []
        }
      }

      // 自動追加をチェック（実行中ゲームのみ対象）
      await this.autoAddGamesFromDatabase(processes)

      // 監視対象ゲームの効率的な検索のため、プロセス情報をマップ化
      const processMap = new Map<string, Array<{ name?: string; pid: number; cmd?: string }>>()

      for (const process of processes) {
        if (process.name) {
          const normalizedName = process.name.toLowerCase().normalize("NFC")
          if (!processMap.has(normalizedName)) {
            processMap.set(normalizedName, [])
          }
          processMap.get(normalizedName)!.push(process)
        }
      }

      for (const [gameId, game] of this.monitoredGames) {
        const normalizedGameExeName = game.exeName.toLowerCase().normalize("NFC")

        // プロセス名に一致するプロセスがある場合のみ詳細チェック
        const matchingProcesses = processMap.get(normalizedGameExeName) || []
        const isRunning =
          matchingProcesses.length > 0
            ? this.isGameProcessRunning(game.exeName, game.exePath, matchingProcesses)
            : false

        const now = new Date()

        if (isRunning) {
          // プロセスが実行中
          game.lastDetected = now
          game.lastNotFound = undefined // リセット

          if (!game.playStartTime) {
            // プレイ開始
            game.playStartTime = now
            game.accumulatedTime = 0
            logger.info(`ゲーム開始を検知: ${game.gameTitle} (${game.exeName})`)
            this.emit("gameStarted", { gameId, gameTitle: game.gameTitle, exeName: game.exeName })
          }
        } else {
          // プロセスが見つからない
          if (!game.lastNotFound) {
            game.lastNotFound = now
          }

          if (game.playStartTime && game.lastDetected) {
            const timeSinceLastDetected = now.getTime() - game.lastDetected.getTime()

            if (timeSinceLastDetected > this.sessionTimeoutMs) {
              // セッション終了
              await this.saveSession(game)
              game.playStartTime = undefined
              game.lastDetected = undefined
              logger.info(`ゲーム終了を検知: ${game.gameTitle} (${game.exeName})`)
              this.emit("gameEnded", {
                gameId,
                gameTitle: game.gameTitle,
                exeName: game.exeName,
                playTime: game.accumulatedTime
              })
            }
          }
        }
      }
      // 長時間プロセスが見つからないゲームをクリーンアップ
      await this.cleanupInactiveGames()
    } catch (error) {
      logger.error("プロセスチェックでエラーが発生しました:", error)
    }
  }

  /**
   * プレイセッションを保存
   * @param game 監視対象のゲーム
   */
  private async saveSession(game: MonitoredGame): Promise<void> {
    if (!game.playStartTime) return

    try {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - game.playStartTime.getTime()) / 1000)
      game.accumulatedTime += duration

      if (duration > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.playSession.create({
            data: {
              duration: game.accumulatedTime,
              gameId: game.gameId,
              sessionName: `自動記録 - ${game.exeName}`
            }
          })

          const gameRecord = await tx.game.findUnique({
            where: { id: game.gameId }
          })

          if (gameRecord) {
            await tx.game.update({
              where: { id: game.gameId },
              data: {
                totalPlayTime: { increment: game.accumulatedTime },
                lastPlayed: endTime
              }
            })
          }
        })

        logger.info(`プレイセッションを保存: ${game.exeName} (${game.accumulatedTime}秒)`)
      }
    } catch (error) {
      logger.error("プレイセッション保存でエラーが発生しました:", error)
    }
  }

  /**
   * 全ての進行中セッションを保存
   */
  private async saveAllActiveSessions(): Promise<void> {
    const promises = Array.from(this.monitoredGames.values())
      .filter((game) => game.playStartTime)
      .map((game) => this.saveSession(game))

    await Promise.all(promises)
  }

  /**
   * 長時間非アクティブなゲームを監視対象から削除
   */
  private async cleanupInactiveGames(): Promise<void> {
    const now = new Date()
    const gamesToRemove: string[] = []

    for (const [gameId, game] of this.monitoredGames) {
      // プレイ中でない かつ 長時間プロセスが見つからない場合
      if (!game.playStartTime && game.lastNotFound) {
        const timeSinceNotFound = now.getTime() - game.lastNotFound.getTime()

        if (timeSinceNotFound > this.gameCleanupTimeoutMs) {
          gamesToRemove.push(gameId)
        }
      }
    }

    // 監視対象から削除
    for (const gameId of gamesToRemove) {
      const game = this.monitoredGames.get(gameId)
      if (game) {
        this.monitoredGames.delete(gameId)
        logger.info(`非アクティブゲームを監視対象から削除: ${game.gameTitle} (${game.exeName})`)
      }
    }
  }

  /**
   * キャッシュされたゲーム情報から自動監視対象に追加
   * @param processes 現在実行中のプロセス一覧
   */
  private async autoAddGamesFromDatabase(
    processes: Array<{ name?: string; pid: number; cmd?: string }>
  ): Promise<void> {
    try {
      // 自動ゲーム検出設定をチェック
      const autoTracking = this.store.get("autoTracking", true) as boolean
      if (!autoTracking) {
        return
      }

      const games = await prisma.game.findMany({ select: { id: true, title: true, exePath: true } })

      if (games.length === 0) {
        return
      }

      // プロセス名をセット化（高速検索用）
      const processNames = new Set<string>()

      for (const process of processes) {
        if (process.name) {
          const normalizedName = process.name.toLowerCase().normalize("NFC")
          processNames.add(normalizedName)
        }
      }

      for (const game of games) {
        // 既に監視対象に含まれている場合はスキップ
        if (this.monitoredGames.has(game.id)) {
          continue
        }

        const exeName = path.basename(game.exePath)
        const normalizedExeName = exeName.toLowerCase().normalize("NFC")

        // プロセス名が存在しない場合は早期リターン
        if (!processNames.has(normalizedExeName)) {
          continue
        }

        // プロセス名が一致する場合のみ詳細チェック
        const isRunning = this.isGameProcessRunning(exeName, game.exePath, processes)

        // プロセスが実行中の場合、監視対象に追加
        if (isRunning) {
          this.addGameInternal(game.id, game.title, game.exePath)
        }
      }
    } catch (error) {
      logger.error("自動監視対象追加でエラーが発生しました:", error)
    }
  }

  /**
   * ネイティブコマンドを使用したプロセス取得方法
   * @returns プロセス一覧
   */
  private async getProcessesNative(): Promise<Array<{ name?: string; pid: number; cmd?: string }>> {
    try {
      if (process.platform === "win32") {
        // Windows: Get-Processを使用してCSV形式で取得
        const { stdout } = await execAsync(
          'powershell -Command "Get-Process | Select-Object ProcessName, Id, Path | ConvertTo-Csv -NoTypeInformation"',
          { encoding: "buffer", timeout: 5000 }
        )

        // CP932からUTF-8に変換して文字化けを防ぐ
        const decodedOutput = iconv.decode(stdout as Buffer, "cp932")
        const lines = decodedOutput.trim().split("\n")

        // ヘッダー行をスキップし、空行を除外
        const processLines = lines.slice(1).filter((line) => line.trim())

        const processes = processLines
          .map((line) => {
            // CSVをパース
            const records = parse(line, {
              columns: false,
              relax_quotes: true,
              skip_empty_lines: true
            })
            const [name, pidStr, fullPath] = records[0]
            const pid = parseInt(pidStr, 10)

            // 基本的な検証（Pathがnullや空でもプロセス名があれば処理）
            if (!name || isNaN(pid) || pid <= 0) {
              return undefined
            }

            // 拡張子がない場合のみ追加（重複防止）
            const processName = name.toLowerCase().endsWith(".exe") ? name : name + ".exe"

            return {
              name: processName,
              pid,
              cmd: fullPath || name // Pathがnullの場合はプロセス名を使用
            }
          })
          .filter((proc): proc is { name: string; pid: number; cmd: string } => proc !== undefined)

        return processes as Array<{ name?: string; pid: number; cmd?: string }>
      } else if (process.platform === "darwin") {
        // macOS: ps コマンドでコマンドライン情報も取得
        const { stdout } = await execAsync("ps -eo pid,comm,args")
        const lines = stdout.trim().split("\n").slice(1) // ヘッダーをスキップ

        const processes = lines
          .map((line) => {
            const match = line.trim().match(/(\d+)\s+(\S+)\s+(.*)/)
            if (match) {
              const pid = parseInt(match[1])
              const name = path.basename(match[2])
              const cmd = match[3] || ""
              return { name, pid, cmd }
            }
            return undefined
          })
          .filter(
            (proc): proc is { name: string; pid: number; cmd: string } =>
              proc !== undefined && proc.pid > 0
          )

        return processes as Array<{ name?: string; pid: number; cmd?: string }>
      } else {
        // Linux: ps コマンドでコマンドライン情報も取得
        const { stdout } = await execAsync("ps -eo pid,comm,cmd --no-headers")
        const lines = stdout.trim().split("\n")

        const processes = lines
          .map((line) => {
            const match = line.trim().match(/(\d+)\s+(\S+)\s+(.*)/)
            if (match) {
              const pid = parseInt(match[1])
              const name = path.basename(match[2])
              const cmd = match[3] || ""
              return { name, pid, cmd }
            }
            return undefined
          })
          .filter(
            (proc): proc is { name: string; pid: number; cmd: string } =>
              proc !== undefined && proc.pid > 0
          )

        return processes as Array<{ name?: string; pid: number; cmd?: string }>
      }
    } catch (error) {
      logger.error("代替プロセス取得でエラーが発生しました:", error)
      return []
    }
  }
}

export default ProcessMonitorService
