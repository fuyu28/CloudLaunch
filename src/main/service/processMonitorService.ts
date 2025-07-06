/**
 * @fileoverview プロセス監視サービス
 *
 * このサービスは、ゲームの実行プロセスを監視し、プレイ時間を自動計測します。
 *
 * 主な機能：
 * - ps-listを使用したプロセス監視
 * - ゲームの実行状態の検知
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
import { app } from "electron"
import { exec } from "child_process"
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
  private readonly intervalMs: number = 5000 // 5秒間隔で監視
  private readonly sessionTimeoutMs: number = 10 // 10秒間プロセスが見つからなかったらセッション終了
  private gamesCache: Array<{ id: string; title: string; exePath: string }> = []
  private lastCacheUpdate: Date | null = null
  private readonly cacheExpiryMs: number = 60000 // 1分間キャッシュを保持

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
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      logger.info("プロセス監視は既に開始されています")
      return
    }

    logger.info("プロセス監視を開始します")

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
    return Array.from(this.monitoredGames.values()).map((game) => ({
      gameId: game.gameId,
      gameTitle: game.gameTitle,
      exeName: game.exeName,
      isPlaying: !!game.playStartTime,
      playTime:
        game.accumulatedTime +
        (game.playStartTime ? Math.floor((Date.now() - game.playStartTime.getTime()) / 1000) : 0)
    }))
  }

  /**
   * プロセスをチェック
   */
  private async checkProcesses(): Promise<void> {
    try {
      logger.info("プロセス一覧を取得中...")
      logger.info(`アプリパッケージ化: ${app.isPackaged}`)
      logger.info(`アプリパス: ${app.getAppPath()}`)
      let processes: Array<{ name?: string; pid: number; cmd?: string }> = []

      try {
        // まずネイティブコマンドを試す
        logger.info("ネイティブコマンドを使用してプロセス一覧を取得中...")
        processes = await this.getProcessesNative()
        logger.info(`ネイティブコマンド: ${processes.length}個のプロセスを取得しました`)

        // cmd情報があるプロセスの数をチェック
        const processesWithCmd = processes.filter((p) => p.cmd && p.cmd.trim().length > 0)
        logger.info(`ネイティブコマンドでcmd情報があるプロセス: ${processesWithCmd.length}個`)
      } catch (error) {
        // ネイティブコマンドが失敗した場合はps-listをフォールバックとして使用
        logger.warn(
          "ネイティブコマンドが失敗しました。ps-listをフォールバックとして使用します:",
          error
        )
        try {
          logger.info("ps-listを使用してプロセス一覧を取得中...")
          processes = await psList()
          logger.info(`ps-list (フォールバック): ${processes.length}個のプロセスを取得しました`)

          const processesWithCmd = processes.filter((p) => p.cmd && p.cmd.trim().length > 0)
          logger.info(`ps-listでcmd情報があるプロセス: ${processesWithCmd.length}個`)
        } catch (fallbackError) {
          logger.error("ps-listもフォールバックとして失敗しました:", fallbackError)
          processes = []
        }
      }

      // Gameテーブルのexeファイルを自動監視対象に追加
      await this.autoAddGamesFromDatabase(processes)

      const processNames = new Set(processes.map((p) => p.name?.toLowerCase()))

      for (const [gameId, game] of this.monitoredGames) {
        const gameExeName = game.exeName.toLowerCase()
        const gameExePath = game.exePath.toLowerCase()

        // 複数の方法でプロセスをチェック
        let isRunning = false

        // 1. パス完全一致 (最優先)
        for (const process of processes) {
          if (process.cmd) {
            const processCmd = process.cmd.toLowerCase()
            // ゲームの実行ファイルパスがプロセスのコマンドラインに含まれているかチェック
            if (processCmd.includes(gameExePath)) {
              isRunning = true
              logger.info(`プロセス検出 (パス一致): ${game.gameTitle} - ${process.cmd}`)
              break
            }
          }
        }

        // 2. ファイル名一致（パス一致しなかった場合のみ）
        if (!isRunning && processNames.has(gameExeName)) {
          // 同名のプロセスが複数のゲームで検出される可能性があるため、
          // プロセスのパス情報を詳細に確認する
          let bestMatch = false

          for (const process of processes) {
            if (process.name?.toLowerCase() === gameExeName && process.cmd) {
              const processCmd = process.cmd.toLowerCase()
              const gameDirectory = path.dirname(gameExePath).toLowerCase()

              // プロセスのパス（cmd）と ゲームの実行ファイルパスを正規化して比較
              const normalizedProcessPath = processCmd.replace(/\\/g, "/")
              const normalizedGamePath = gameExePath.replace(/\\/g, "/")

              if (normalizedProcessPath === normalizedGamePath) {
                bestMatch = true
                logger.info(`プロセス検出 (パス完全一致): ${game.gameTitle} - ${process.cmd}`)
                break
              } else if (normalizedProcessPath.includes(gameDirectory.replace(/\\/g, "/"))) {
                bestMatch = true
                logger.info(
                  `プロセス検出 (ディレクトリ部分一致): ${game.gameTitle} - ${process.cmd}`
                )
                break
              }
            }
            if (process.cmd) {
              logger.debug(`cmd: ${process.cmd}`)
            }
          }

          if (bestMatch) {
            isRunning = true
          } else {
            // フォールバック: ディレクトリ一致しない場合は検出しない
            logger.info(
              `プロセス検出スキップ (ディレクトリ不一致): ${game.gameTitle} - ${game.exeName}`
            )
          }
        }

        const now = new Date()

        if (isRunning) {
          // プロセスが実行中
          game.lastDetected = now

          if (!game.playStartTime) {
            // プレイ開始
            game.playStartTime = now
            game.accumulatedTime = 0
            logger.info(`ゲーム開始を検知: ${game.gameTitle} (${game.exeName})`)
            this.emit("gameStarted", { gameId, gameTitle: game.gameTitle, exeName: game.exeName })
          }
        } else {
          // プロセスが見つからない
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
      // デバッグ用：監視対象のゲームをログ出力
      for (const [gameId, game] of this.monitoredGames) {
        logger.info(`監視中のゲーム: ${game.exeName} (ID: ${gameId})`)
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
              gameId: game.gameId
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
   * ゲーム情報キャッシュを更新
   */
  private async updateGamesCache(): Promise<void> {
    try {
      const now = new Date()

      // キャッシュが有効な場合はスキップ
      if (
        this.lastCacheUpdate &&
        now.getTime() - this.lastCacheUpdate.getTime() < this.cacheExpiryMs
      ) {
        return
      }

      const games = await prisma.game.findMany({
        select: {
          id: true,
          title: true,
          exePath: true
        }
      })

      this.gamesCache = games
      this.lastCacheUpdate = now
      logger.info(`ゲーム情報キャッシュを更新: ${games.length}個のゲーム`)
    } catch (error) {
      logger.error("ゲーム情報キャッシュ更新エラー:", error)
    }
  }

  /**
   * データベースからゲーム情報を取得して自動監視対象に追加
   * @param processes 現在実行中のプロセス一覧
   */
  private async autoAddGamesFromDatabase(
    processes: Array<{ name?: string; pid: number; cmd?: string }>
  ): Promise<void> {
    try {
      // キャッシュを更新
      await this.updateGamesCache()

      if (this.gamesCache.length === 0) {
        return
      }

      const processNames = new Set(processes.map((p) => p.name?.toLowerCase()).filter(Boolean))

      for (const game of this.gamesCache) {
        // 既に監視対象に含まれている場合はスキップ
        if (this.monitoredGames.has(game.id)) {
          continue
        }

        const exeName = path.basename(game.exePath).toLowerCase()
        const gameExePath = game.exePath.toLowerCase()

        // プロセス一覧に含まれているかチェック
        let isRunning = false

        // 1. パス完全一致 (最優先)
        for (const process of processes) {
          if (process.cmd) {
            const processCmd = process.cmd.toLowerCase()
            // ゲームの実行ファイルパスがプロセスのコマンドラインに含まれているかチェック
            if (processCmd.includes(gameExePath)) {
              isRunning = true
              logger.info(`自動監視追加 (パス一致): ${game.title} - ${process.cmd}`)
              break
            }
          }
        }

        // 2. ファイル名一致（パス一致しなかった場合のみ）
        if (!isRunning && processNames.has(exeName)) {
          // 同名のプロセスが複数のゲームで検出される可能性があるため、
          // プロセスのパス情報を詳細に確認する
          let bestMatch = false

          for (const process of processes) {
            if (process.name?.toLowerCase() === exeName && process.cmd) {
              const processCmd = process.cmd.toLowerCase()
              const gameDirectory = path.dirname(gameExePath).toLowerCase()

              // デバッグ情報を追加
              logger.info(`ディレクトリ一致チェック: ${game.title}`)
              logger.info(`ゲームディレクトリ: ${gameDirectory}`)
              logger.info(`プロセスコマンド: ${processCmd}`)

              // プロセスのパス（cmd）と ゲームの実行ファイルパスを正規化して比較
              const normalizedProcessPath = processCmd.replace(/\\/g, "/")
              const normalizedGamePath = gameExePath.replace(/\\/g, "/")

              if (normalizedProcessPath === normalizedGamePath) {
                bestMatch = true
                logger.info(`自動監視追加 (パス完全一致): ${game.title} - ${process.cmd}`)
                break
              } else if (normalizedProcessPath.includes(gameDirectory.replace(/\\/g, "/"))) {
                bestMatch = true
                logger.info(`自動監視追加 (ディレクトリ部分一致): ${game.title} - ${process.cmd}`)
                break
              }
            }
          }

          if (bestMatch) {
            isRunning = true
          } else {
            // フォールバック: ディレクトリ一致しない場合は自動監視に追加しない
            logger.info(`自動監視スキップ (ディレクトリ不一致): ${game.title} - ${exeName}`)
          }
        }

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
        // Windows: PowerShellを使用してより詳細なプロセス情報を取得
        const { stdout } = await execAsync(
          'powershell "Get-Process | Select-Object ProcessName, Id, Path | ConvertTo-Csv -NoTypeInformation"'
        )
        const lines = stdout.trim().split("\n")

        // ヘッダー行をスキップ
        const processLines = lines.slice(1).filter((line) => line.trim())

        const processes = processLines
          .map((line) => {
            // CSVパースing（簡単な方法）
            const match = line.match(/"([^"]*?)","(\d+)","([^"]*?)"/)
            if (match) {
              const name = match[1].toLowerCase()
              const pid = parseInt(match[2])
              const fullPath = match[3] ? match[3].toLowerCase().replace(/\\/g, "/") : ""

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
