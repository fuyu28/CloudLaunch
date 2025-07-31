/**
 * @fileoverview パフォーマンス監視ユーティリティ
 *
 * このファイルは、アプリケーションの重要な操作のパフォーマンスを監視します。
 * 主な機能：
 * - 操作実行時間の測定
 * - パフォーマンス統計の収集
 * - しきい値超過の警告
 * - パフォーマンスログの記録
 */

import { logger } from "./logger"

/**
 * パフォーマンス測定結果
 */
export interface PerformanceResult {
  /** 操作名 */
  operation: string
  /** 実行時間（ミリ秒） */
  duration: number
  /** 開始時刻 */
  startTime: number
  /** 終了時刻 */
  endTime: number
  /** 追加のメタデータ */
  metadata?: Record<string, unknown>
}

/**
 * パフォーマンス警告しきい値（ミリ秒）
 */
const PERFORMANCE_THRESHOLDS = {
  /** ゲーム起動 */
  gamelaunch: 5000,
  /** ファイルアップロード */
  fileupload: 10000,
  /** ファイルダウンロード */
  filedownload: 10000,
  /** データベース操作 */
  database: 1000,
  /** ファイル読み込み */
  fileread: 2000,
  /** API呼び出し */
  api: 3000,
  /** 画像読み込み */
  imageload: 1000,
  /** ページ読み込み */
  pageload: 2000,
  /** 一般的な操作 */
  default: 5000
} as const

/**
 * パフォーマンス統計
 */
interface PerformanceStats {
  /** 操作回数 */
  count: number
  /** 合計実行時間 */
  totalDuration: number
  /** 平均実行時間 */
  averageDuration: number
  /** 最小実行時間 */
  minDuration: number
  /** 最大実行時間 */
  maxDuration: number
  /** 最後の測定時刻 */
  lastMeasured: Date
}

/**
 * パフォーマンス監視クラス
 */
class PerformanceMonitor {
  private stats = new Map<string, PerformanceStats>()
  private activeTimers = new Map<string, number>()

  /**
   * パフォーマンス測定を開始
   *
   * @param operation 操作名
   * @param metadata 追加のメタデータ
   * @returns 測定終了関数
   */
  startTimer(operation: string, metadata?: Record<string, unknown>): () => PerformanceResult {
    const startTime = window.performance.now()
    const timerId = `${operation}_${Date.now()}_${Math.random()}`

    this.activeTimers.set(timerId, startTime)

    return (): PerformanceResult => {
      const endTime = window.performance.now()
      const duration = endTime - startTime

      this.activeTimers.delete(timerId)

      const result: PerformanceResult = {
        operation,
        duration,
        startTime,
        endTime,
        metadata
      }

      this.recordPerformance(result)
      return result
    }
  }

  /**
   * 非同期操作のパフォーマンス測定
   *
   * @param operation 操作名
   * @param asyncFn 非同期関数
   * @param metadata 追加のメタデータ
   * @returns 非同期関数の結果とパフォーマンス結果
   */
  async measureAsync<T>(
    operation: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<{ result: T; performance: PerformanceResult }> {
    const endTimer = this.startTimer(operation, metadata)

    try {
      const result = await asyncFn()
      const performanceResult = endTimer()

      return { result, performance: performanceResult }
    } catch (error) {
      const performanceResult = endTimer()

      // エラーが発生した場合もパフォーマンスを記録
      logger.warn("パフォーマンス測定中にエラーが発生", {
        component: "PerformanceMonitor",
        function: "measureAsync",
        data: { operation, duration: performanceResult.duration, error }
      })

      throw error
    }
  }

  /**
   * 同期操作のパフォーマンス測定
   *
   * @param operation 操作名
   * @param syncFn 同期関数
   * @param metadata 追加のメタデータ
   * @returns 同期関数の結果とパフォーマンス結果
   */
  measure<T>(
    operation: string,
    syncFn: () => T,
    metadata?: Record<string, unknown>
  ): { result: T; performance: PerformanceResult } {
    const endTimer = this.startTimer(operation, metadata)

    try {
      const result = syncFn()
      const performanceResult = endTimer()

      return { result, performance: performanceResult }
    } catch (error) {
      const performanceResult = endTimer()

      logger.warn("パフォーマンス測定中にエラーが発生", {
        component: "PerformanceMonitor",
        function: "measure",
        data: { operation, duration: performanceResult.duration, error }
      })

      throw error
    }
  }

  /**
   * パフォーマンス結果を記録
   */
  private recordPerformance(result: PerformanceResult): void {
    // 統計を更新
    this.updateStats(result)

    // しきい値チェック
    this.checkThreshold(result)

    // ログに記録
    this.logPerformance(result)
  }

  /**
   * パフォーマンス統計を更新
   */
  private updateStats(result: PerformanceResult): void {
    const existing = this.stats.get(result.operation)

    if (existing) {
      const newCount = existing.count + 1
      const newTotalDuration = existing.totalDuration + result.duration

      const updatedStats: PerformanceStats = {
        count: newCount,
        totalDuration: newTotalDuration,
        averageDuration: newTotalDuration / newCount,
        minDuration: Math.min(existing.minDuration, result.duration),
        maxDuration: Math.max(existing.maxDuration, result.duration),
        lastMeasured: new Date()
      }

      this.stats.set(result.operation, updatedStats)
    } else {
      const newStats: PerformanceStats = {
        count: 1,
        totalDuration: result.duration,
        averageDuration: result.duration,
        minDuration: result.duration,
        maxDuration: result.duration,
        lastMeasured: new Date()
      }

      this.stats.set(result.operation, newStats)
    }
  }

  /**
   * パフォーマンスしきい値をチェック
   */
  private checkThreshold(result: PerformanceResult): void {
    const threshold =
      PERFORMANCE_THRESHOLDS[result.operation as keyof typeof PERFORMANCE_THRESHOLDS] ||
      PERFORMANCE_THRESHOLDS.default

    if (result.duration > threshold) {
      logger.warn("パフォーマンス警告: しきい値を超過", {
        component: "PerformanceMonitor",
        function: "checkThreshold",
        data: {
          operation: result.operation,
          duration: `${result.duration.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          exceeded: `${(result.duration - threshold).toFixed(2)}ms`,
          metadata: result.metadata
        }
      })
    }
  }

  /**
   * パフォーマンス結果をログに記録
   */
  private logPerformance(result: PerformanceResult): void {
    const stats = this.stats.get(result.operation)

    logger.info("パフォーマンス測定完了", {
      component: "PerformanceMonitor",
      function: "logPerformance",
      data: {
        operation: result.operation,
        duration: `${result.duration.toFixed(2)}ms`,
        average: stats ? `${stats.averageDuration.toFixed(2)}ms` : "N/A",
        count: stats?.count || 1,
        metadata: result.metadata
      }
    })
  }

  /**
   * 操作の統計を取得
   */
  getStats(operation?: string): Map<string, PerformanceStats> | PerformanceStats | undefined {
    if (operation) {
      return this.stats.get(operation)
    }
    return new Map(this.stats)
  }

  /**
   * 統計をリセット
   */
  resetStats(operation?: string): void {
    if (operation) {
      this.stats.delete(operation)
      logger.info("パフォーマンス統計をリセット", {
        component: "PerformanceMonitor",
        data: { operation }
      })
    } else {
      this.stats.clear()
      logger.info("全パフォーマンス統計をリセット", {
        component: "PerformanceMonitor"
      })
    }
  }

  /**
   * アクティブなタイマー数を取得
   */
  getActiveTimerCount(): number {
    return this.activeTimers.size
  }

  /**
   * 現在のパフォーマンス状況をレポート
   */
  generateReport(): string {
    const report: string[] = ["=== パフォーマンス レポート ==="]

    if (this.stats.size === 0) {
      report.push("統計データなし")
      return report.join("\n")
    }

    const sortedStats = Array.from(this.stats.entries()).sort(
      ([, a], [, b]) => b.averageDuration - a.averageDuration
    )

    for (const [operation, stats] of sortedStats) {
      report.push(`
操作: ${operation}
  実行回数: ${stats.count}
  平均時間: ${stats.averageDuration.toFixed(2)}ms
  最小時間: ${stats.minDuration.toFixed(2)}ms
  最大時間: ${stats.maxDuration.toFixed(2)}ms
  合計時間: ${stats.totalDuration.toFixed(2)}ms
  最終測定: ${stats.lastMeasured.toLocaleString()}`)
    }

    report.push(`\nアクティブタイマー: ${this.activeTimers.size}`)

    return report.join("\n")
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor()

/**
 * 便利なパフォーマンス測定用ヘルパー
 */
export const performance = {
  /**
   * ゲーム起動パフォーマンス測定
   */
  measureGameLaunch: <T>(asyncFn: () => Promise<T>, gameId: string) =>
    performanceMonitor.measureAsync("gamelaunch", asyncFn, { gameId }),

  /**
   * ファイルアップロードパフォーマンス測定
   */
  measureFileUpload: <T>(asyncFn: () => Promise<T>, fileSize?: number) =>
    performanceMonitor.measureAsync("fileupload", asyncFn, { fileSize }),

  /**
   * ファイルダウンロードパフォーマンス測定
   */
  measureFileDownload: <T>(asyncFn: () => Promise<T>, fileSize?: number) =>
    performanceMonitor.measureAsync("filedownload", asyncFn, { fileSize }),

  /**
   * データベース操作パフォーマンス測定
   */
  measureDatabase: <T>(asyncFn: () => Promise<T>, operation: string) =>
    performanceMonitor.measureAsync("database", asyncFn, { operation }),

  /**
   * API呼び出しパフォーマンス測定
   */
  measureAPI: <T>(asyncFn: () => Promise<T>, endpoint: string) =>
    performanceMonitor.measureAsync("api", asyncFn, { endpoint }),

  /**
   * 画像読み込みパフォーマンス測定
   */
  measureImageLoad: <T>(asyncFn: () => Promise<T>, imagePath: string) =>
    performanceMonitor.measureAsync("imageload", asyncFn, { imagePath }),

  /**
   * ページ読み込みパフォーマンス測定
   */
  measurePageLoad: <T>(syncFn: () => T, pageName: string) =>
    performanceMonitor.measure("pageload", syncFn, { pageName })
}
