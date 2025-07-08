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

import psList from "ps-list"
import { EventEmitter } from "events"
import { prisma } from "../db"
import { logger } from "../utils/logger"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import * as iconv from "iconv-lite"

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
  private static instance: ProcessMonitorService | null = null
  private monitoredGames: Map<string, MonitoredGame> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly intervalMs: number = 2000 // 2秒間隔で監視
  private readonly sessionTimeoutMs: number = 4000 // 4秒間プロセスが見つからなかったらセッション終了
  private gamesCache: Array<{ id: string; title: string; exePath: string }> = []
  private isInitialized: boolean = false // 初期化フラグ
  private readonly gameCleanupTimeoutMs: number = 20000 // 20秒間プロセスが見つからない場合に監視対象から削除
  private processCache: Array<{ name?: string; pid: number; cmd?: string }> = []
  private lastProcessCacheUpdate: Date | null = null
  private readonly processCacheExpiryMs: number = 10000 // 10秒間プロセスキャッシュを保持
  private readonly maxProcessCacheSize: number = 1000 // プロセスキャッシュの最大サイズ

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

  /**
   * 監視を開始
   */
  public async startMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      logger.info("プロセス監視は既に開始されています")
      return
    }

    logger.info("プロセス監視を開始します")

    // 監視開始時にDBからゲーム情報をロード
    if (!this.isInitialized) {
      await this.loadGamesFromDatabase()
      this.isInitialized = true
    }

    // 開始時に即座にプロセスチェックを実行
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
    return this.monitoringInterval !== null
  }

  /**
   * 監視を停止
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info("プロセス監視を停止しました")
    }

    // 進行中のセッションを保存
    this.saveAllActiveSessions()

    // メモリをクリア（最適化）
    this.clearCaches()
  }

  /**
   * キャッシュをクリアしてメモリを解放
   */
  private clearCaches(): void {
    this.gamesCache.length = 0
    this.processCache.length = 0
    this.lastProcessCacheUpdate = null
    this.isInitialized = false
    logger.debug("キャッシュをクリアしました")
  }

  /**
   * ゲームを監視対象に追加
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

    logger.debug(`監視状況取得: ${status.length}個のゲーム`)
    return status
  }

  /**
   * ゲームプロセスが実行中かチェック
   * @param gameExeName 正規化されたゲーム実行ファイル名（小文字・NFC正規化済み）
   * @param gameExePath 正規化されたゲーム実行ファイルパス（小文字・NFC正規化済み）
   * @param processes プロセス一覧
   * @param gameTitle デバッグ用ゲームタイトル
   * @param isAutoAdd 自動追加の場合はtrue（ログメッセージ調整用）
   * @returns プロセスが実行中かどうか
   */
  private isGameProcessRunning(
    gameExeName: string,
    gameExePath: string,
    processes: Array<{ name?: string; pid: number; cmd?: string }>,
    gameTitle: string,
    isAutoAdd: boolean = false
  ): boolean {
    const logPrefix = isAutoAdd ? "自動監視追加" : "プロセス検出"

    // 1. パス完全一致チェック（最優先）
    for (const process of processes) {
      if (process.cmd && process.name?.toLowerCase().normalize("NFC") === gameExeName) {
        const processCmd = process.cmd.toLowerCase().normalize("NFC")
        if (processCmd.includes(gameExePath)) {
          logger.debug(`${logPrefix} (パス一致): ${gameTitle}`)
          return true
        }
      }
    }

    // 2. ディレクトリ部分一致チェック
    const gameDirectory = path.dirname(gameExePath)
    for (const process of processes) {
      if (process.name?.toLowerCase().normalize("NFC") === gameExeName && process.cmd) {
        const processCmd = process.cmd.toLowerCase().normalize("NFC")
        if (processCmd === gameExePath) {
          logger.debug(`${logPrefix} (パス完全一致): ${gameTitle}`)
          return true
        } else if (processCmd.includes(gameDirectory)) {
          logger.debug(`${logPrefix} (ディレクトリ部分一致): ${gameTitle}`)
          return true
        }
      }
    }

    logger.debug(`${logPrefix}スキップ (全マッチ失敗): ${gameTitle}`)
    return false
  }

  /**
   * プロセスをチェック
   */
  private async checkProcesses(): Promise<void> {
    try {
      let processes: Array<{ name?: string; pid: number; cmd?: string }> = []

      // プロセスキャッシュを使用して負荷を軽減
      const now = new Date()
      const shouldUpdateProcessCache =
        !this.lastProcessCacheUpdate ||
        now.getTime() - this.lastProcessCacheUpdate.getTime() > this.processCacheExpiryMs

      if (shouldUpdateProcessCache) {
        logger.debug("プロセス一覧を取得中...")

        try {
          // まずネイティブコマンドを試す
          processes = await this.getProcessesNative()
          logger.debug(`ネイティブコマンド: ${processes.length}個のプロセスを取得しました`)

          // プロセスキャッシュを更新（サイズ制限適用）
          if (processes.length > this.maxProcessCacheSize) {
            logger.warn(
              `プロセス数が上限(${this.maxProcessCacheSize})を超過: ${processes.length}個、先頭${this.maxProcessCacheSize}個のみキャッシュ`
            )
            this.processCache = processes.slice(0, this.maxProcessCacheSize)
          } else {
            this.processCache = processes
          }
          this.lastProcessCacheUpdate = now
        } catch (error) {
          // ネイティブコマンドが失敗した場合はps-listをフォールバックとして使用
          logger.warn(
            "ネイティブコマンドが失敗しました。ps-listをフォールバックとして使用します:",
            error
          )
          try {
            processes = await psList()
            logger.debug(`ps-list (フォールバック): ${processes.length}個のプロセスを取得しました`)

            // プロセスキャッシュを更新（サイズ制限適用）
            if (processes.length > this.maxProcessCacheSize) {
              logger.warn(
                `プロセス数が上限(${this.maxProcessCacheSize})を超過: ${processes.length}個、先頭${this.maxProcessCacheSize}個のみキャッシュ`
              )
              this.processCache = processes.slice(0, this.maxProcessCacheSize)
            } else {
              this.processCache = processes
            }
            this.lastProcessCacheUpdate = now
          } catch (fallbackError) {
            logger.error("ps-listもフォールバックとして失敗しました:", fallbackError)
            processes = []
          }
        }
      } else {
        // キャッシュを使用
        processes = this.processCache
        logger.debug("プロセスキャッシュを使用")
      }

      // 常に自動追加をチェック（DB参照は初期化時のみ）
      await this.autoAddGamesFromDatabase(processes)

      // 効率的なプロセス検索のためのマップを作成
      const processMap = new Map<string, { name?: string; pid: number; cmd?: string }>()
      const processNames = new Set<string>()

      for (const process of processes) {
        if (process.name) {
          const lowerName = process.name.toLowerCase().normalize("NFC")
          processNames.add(lowerName)
          processMap.set(lowerName, process)
        }
      }

      for (const [gameId, game] of this.monitoredGames) {
        const gameExeName = game.exeName.toLowerCase().normalize("NFC")
        const gameExePath = game.exePath.toLowerCase().normalize("NFC")

        // プロセス名が存在する場合のみチェック
        const isRunning = processNames.has(gameExeName)
          ? this.isGameProcessRunning(gameExeName, gameExePath, processes, game.gameTitle)
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

      // デバッグ用：監視対象のゲームをログ出力
      if (this.monitoredGames.size > 0 && shouldUpdateProcessCache) {
        logger.debug(
          `監視中のゲーム数: ${this.monitoredGames.size}個, 取得したプロセス数: ${processes.length}個`
        )
      }
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
   * 監視開始時にDBからゲーム情報をロード（一度だけ実行）
   */
  private async loadGamesFromDatabase(): Promise<void> {
    try {
      const games = await prisma.game.findMany({
        select: {
          id: true,
          title: true,
          exePath: true
        }
      })

      this.gamesCache = games
      logger.info(`DBからゲーム情報をロード: ${games.length}個のゲーム`)
    } catch (error) {
      logger.error("DBからのゲーム情報ロードエラー:", error)
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
      // キャッシュが空の場合はスキップ（初期化済みの場合のみ実行）
      if (this.gamesCache.length === 0) {
        return
      }

      const processNames = new Set(
        processes.map((p) => p.name?.toLowerCase().normalize("NFC")).filter(Boolean)
      )

      for (const game of this.gamesCache) {
        // 既に監視対象に含まれている場合はスキップ
        if (this.monitoredGames.has(game.id)) {
          continue
        }

        const exeName = path.basename(game.exePath).toLowerCase().normalize("NFC")
        const gameExePath = game.exePath.toLowerCase().normalize("NFC")

        // プロセス名が存在する場合のみチェック
        const isRunning = processNames.has(exeName)
          ? this.isGameProcessRunning(exeName, gameExePath, processes, game.title, true)
          : false

        // プロセスが実行中の場合、監視対象に追加
        if (isRunning) {
          this.addGame(game.id, game.title, game.exePath)
          logger.info(`自動監視対象に追加: ${game.title} (${exeName})`)
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
        // Windows: PowerShellを使用してより詳細なプロセス情報を取得（バイナリモードで文字化け対策）
        const { stdout } = await execAsync(
          'powershell "Get-Process | Select-Object ProcessName, Id, Path | ConvertTo-Csv -NoTypeInformation"',
          { encoding: "buffer" }
        )

        // CP932からUTF-8に変換して文字化けを防ぐ
        const decodedOutput = iconv.decode(stdout as Buffer, "cp932")
        const lines = decodedOutput.trim().split("\n")

        // ヘッダー行をスキップ
        const processLines = lines.slice(1).filter((line) => line.trim())

        const processes = processLines
          .map((line) => {
            // CSVパースing（簡単な方法）
            const match = line.match(/"([^"]*?)","(\d+)","([^"]*?)"/)
            if (match) {
              // 文字列の正規化処理（Unicode統一 + 小文字化）
              const name = match[1].toLowerCase().normalize("NFC")
              const pid = parseInt(match[2])
              const fullPath = match[3] ? match[3].toLowerCase().normalize("NFC") : ""

              if (!isNaN(pid) && name && fullPath) {
                return {
                  name: name + ".exe", // 拡張子を追加
                  pid,
                  cmd: fullPath
                }
              }
            }
            return null
          })
          .filter(
            (proc): proc is { name: string; pid: number; cmd: string } =>
              proc !== null && proc.cmd !== ""
          )

        logger.info(`Windows PowerShell: ${processes.length}個のプロセスを取得`)

        // デバッグ用：実行ファイルのパスを表示
        const exeProcesses = processes.filter((p) => p.name.includes("siglusengine"))
        for (const proc of exeProcesses) {
          logger.info(`SiglusEngine検出: ${proc.name} -> ${proc.cmd}`)
        }

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
              const name = path.basename(match[2]).toLowerCase()
              const cmd = match[3] ? match[3].toLowerCase() : ""
              return { name, pid, cmd }
            }
            return null
          })
          .filter(
            (proc): proc is { name: string; pid: number; cmd: string } =>
              proc !== null && proc.pid > 0
          )

        logger.info(`macOS ps: ${processes.length}個のプロセスを取得`)
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
              const name = path.basename(match[2]).toLowerCase()
              const cmd = match[3] ? match[3].toLowerCase() : ""
              return { name, pid, cmd }
            }
            return null
          })
          .filter(
            (proc): proc is { name: string; pid: number; cmd: string } =>
              proc !== null && proc.pid > 0
          )

        logger.info(`Linux ps: ${processes.length}個のプロセスを取得`)
        return processes as Array<{ name?: string; pid: number; cmd?: string }>
      }
    } catch (error) {
      logger.error("代替プロセス取得でエラーが発生しました:", error)
      return []
    }
  }
}

export default ProcessMonitorService
