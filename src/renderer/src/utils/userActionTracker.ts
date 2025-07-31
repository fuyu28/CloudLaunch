/**
 * @fileoverview ユーザーアクション追跡ユーティリティ
 *
 * このファイルは、重要なユーザーアクションを追跡・記録します。
 * 主な機能：
 * - ユーザー操作の記録
 * - アクション統計の収集
 * - セッション情報の管理
 * - 使用状況の分析
 */

import { logger } from "./logger"

/**
 * ユーザーアクションの種類
 */
export type UserActionType =
  | "game_created"
  | "game_updated"
  | "game_deleted"
  | "game_launched"
  | "session_created"
  | "session_updated"
  | "session_deleted"
  | "save_uploaded"
  | "save_downloaded"
  | "settings_updated"
  | "page_visited"
  | "search_performed"
  | "filter_applied"
  | "memo_created"
  | "memo_updated"
  | "memo_deleted"
  | "chapter_created"
  | "chapter_updated"
  | "chapter_deleted"
  | "error_occurred"
  | "performance_issue"
  | "feature_used"

/**
 * ユーザーアクションデータ
 */
export interface UserAction {
  /** アクションの種類 */
  type: UserActionType
  /** アクションの詳細説明 */
  description: string
  /** 発生時刻 */
  timestamp: Date
  /** セッションID */
  sessionId: string
  /** アクション実行時間（ミリ秒、該当する場合） */
  duration?: number
  /** 関連するエンティティID */
  entityId?: string
  /** 追加のメタデータ */
  metadata?: Record<string, unknown>
  /** エラー情報（該当する場合） */
  error?: {
    message: string
    stack?: string
  }
}

/**
 * セッション情報
 */
interface UserSession {
  /** セッションID */
  id: string
  /** セッション開始時刻 */
  startTime: Date
  /** 最後のアクティビティ時刻 */
  lastActivity: Date
  /** アクション数 */
  actionCount: number
  /** ユーザーエージェント */
  userAgent: string
  /** アプリケーションバージョン */
  appVersion: string
}

/**
 * アクション統計
 */
interface ActionStats {
  /** アクション種類別の実行回数 */
  countByType: Record<UserActionType, number>
  /** 合計アクション数 */
  totalActions: number
  /** 今日のアクション数 */
  todayActions: number
  /** 最も使用される機能 */
  mostUsedFeatures: Array<{ type: UserActionType; count: number }>
  /** 平均セッション時間 */
  averageSessionDuration: number
}

/**
 * ユーザーアクション追跡クラス
 */
class UserActionTracker {
  private currentSession: UserSession | null = null
  private actions: UserAction[] = []
  private readonly maxActionsInMemory = 1000
  private readonly sessionTimeoutMs = 30 * 60 * 1000 // 30分

  constructor() {
    this.initializeSession()
    this.setupEventListeners()
  }

  /**
   * セッションを初期化
   */
  private initializeSession(): void {
    const sessionId = this.generateSessionId()

    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      actionCount: 0,
      userAgent: navigator.userAgent,
      appVersion: this.getAppVersion()
    }

    logger.info("ユーザーセッションを開始", {
      component: "UserActionTracker",
      function: "initializeSession",
      data: {
        sessionId: this.currentSession.id,
        userAgent: this.currentSession.userAgent,
        appVersion: this.currentSession.appVersion
      }
    })
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // ページの終了時にセッションを終了
    window.addEventListener("beforeunload", () => {
      this.endSession()
    })

    // アクティビティがない場合のセッションタイムアウト
    setInterval(() => {
      this.checkSessionTimeout()
    }, 60000) // 1分ごとにチェック
  }

  /**
   * セッションIDを生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * アプリケーションバージョンを取得
   */
  private getAppVersion(): string {
    // package.jsonから取得するか、環境変数から取得
    return process.env.npm_package_version || "unknown"
  }

  /**
   * セッションタイムアウトをチェック
   */
  private checkSessionTimeout(): void {
    if (!this.currentSession) return

    const now = new Date()
    const timeSinceLastActivity = now.getTime() - this.currentSession.lastActivity.getTime()

    if (timeSinceLastActivity > this.sessionTimeoutMs) {
      this.endSession()
      this.initializeSession()
    }
  }

  /**
   * ユーザーアクションを記録
   */
  trackAction(
    type: UserActionType,
    description: string,
    options: {
      entityId?: string
      metadata?: Record<string, unknown>
      error?: { message: string; stack?: string }
      duration?: number
    } = {}
  ): void {
    if (!this.currentSession) {
      this.initializeSession()
    }

    const action: UserAction = {
      type,
      description,
      timestamp: new Date(),
      sessionId: this.currentSession!.id,
      duration: options.duration,
      entityId: options.entityId,
      metadata: options.metadata,
      error: options.error
    }

    // アクションを配列に追加
    this.actions.push(action)

    // メモリ使用量を制限
    if (this.actions.length > this.maxActionsInMemory) {
      this.actions = this.actions.slice(-this.maxActionsInMemory)
    }

    // セッション情報を更新
    this.currentSession!.lastActivity = new Date()
    this.currentSession!.actionCount++

    // ログに記録
    logger.logUserAction(description, {
      type,
      sessionId: this.currentSession!.id,
      entityId: options.entityId,
      duration: options.duration,
      ...options.metadata
    })

    // 重要なアクションの場合はパフォーマンス測定も行う
    if (this.shouldMeasurePerformance(type)) {
      this.measureActionPerformance(action)
    }
  }

  /**
   * パフォーマンス測定が必要なアクションかチェック
   */
  private shouldMeasurePerformance(type: UserActionType): boolean {
    const performanceCriticalActions: UserActionType[] = [
      "game_launched",
      "save_uploaded",
      "save_downloaded",
      "page_visited"
    ]

    return performanceCriticalActions.includes(type)
  }

  /**
   * アクションのパフォーマンスを測定
   */
  private measureActionPerformance(action: UserAction): void {
    if (action.duration) {
      logger.info("アクションパフォーマンス測定", {
        component: "UserActionTracker",
        function: "measureActionPerformance",
        data: {
          actionType: action.type,
          duration: `${action.duration}ms`,
          description: action.description
        }
      })
    }
  }

  /**
   * 特定のアクション種類の統計を取得
   */
  getActionStats(): ActionStats {
    const countByType = {} as Record<UserActionType, number>
    let todayActions = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // アクション種類別の集計
    for (const action of this.actions) {
      countByType[action.type] = (countByType[action.type] || 0) + 1

      if (action.timestamp >= today) {
        todayActions++
      }
    }

    // 最も使用される機能を計算
    const mostUsedFeatures = Object.entries(countByType)
      .map(([type, count]) => ({ type: type as UserActionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 平均セッション時間を計算（簡易版）
    const averageSessionDuration = this.calculateAverageSessionDuration()

    return {
      countByType,
      totalActions: this.actions.length,
      todayActions,
      mostUsedFeatures,
      averageSessionDuration
    }
  }

  /**
   * 平均セッション時間を計算
   */
  private calculateAverageSessionDuration(): number {
    if (!this.currentSession) return 0

    const sessionDuration = new Date().getTime() - this.currentSession.startTime.getTime()
    return sessionDuration / 1000 / 60 // 分単位
  }

  /**
   * セッションを終了
   */
  private endSession(): void {
    if (!this.currentSession) return

    const sessionDuration = new Date().getTime() - this.currentSession.startTime.getTime()

    logger.info("ユーザーセッションを終了", {
      component: "UserActionTracker",
      function: "endSession",
      data: {
        sessionId: this.currentSession.id,
        duration: `${Math.round(sessionDuration / 1000 / 60)}分`,
        actionCount: this.currentSession.actionCount
      }
    })

    this.currentSession = null
  }

  /**
   * 現在のセッション情報を取得
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession
  }

  /**
   * 最近のアクションを取得
   */
  getRecentActions(limit: number = 50): UserAction[] {
    return this.actions.slice(-limit).reverse()
  }

  /**
   * 統計レポートを生成
   */
  generateReport(): string {
    const stats = this.getActionStats()
    const session = this.getCurrentSession()

    const report = [
      "=== ユーザーアクション レポート ===",
      `現在のセッション: ${session?.id || "なし"}`,
      `セッション開始: ${session?.startTime.toLocaleString() || "N/A"}`,
      `総アクション数: ${stats.totalActions}`,
      `今日のアクション数: ${stats.todayActions}`,
      `平均セッション時間: ${stats.averageSessionDuration.toFixed(1)}分`,
      "",
      "最も使用される機能:",
      ...stats.mostUsedFeatures.map(
        (feature, index) => `  ${index + 1}. ${feature.type}: ${feature.count}回`
      )
    ]

    return report.join("\n")
  }
}

// シングルトンインスタンス
export const userActionTracker = new UserActionTracker()

/**
 * よく使われるアクション追跡用のヘルパー関数
 */
export const trackAction = {
  gameCreated: (gameId: string, gameTitle: string) =>
    userActionTracker.trackAction("game_created", `ゲーム作成: ${gameTitle}`, { entityId: gameId }),

  gameLaunched: (gameId: string, gameTitle: string, duration?: number) =>
    userActionTracker.trackAction("game_launched", `ゲーム起動: ${gameTitle}`, {
      entityId: gameId,
      duration
    }),

  saveUploaded: (gameId: string, fileSize?: number) =>
    userActionTracker.trackAction("save_uploaded", "セーブデータアップロード", {
      entityId: gameId,
      metadata: { fileSize }
    }),

  pageVisited: (pageName: string) =>
    userActionTracker.trackAction("page_visited", `ページ表示: ${pageName}`, {
      metadata: { pageName }
    }),

  searchPerformed: (query: string, resultCount: number) =>
    userActionTracker.trackAction("search_performed", `検索実行: ${query}`, {
      metadata: { query, resultCount }
    }),

  errorOccurred: (error: Error, context: string) =>
    userActionTracker.trackAction("error_occurred", `エラー発生: ${context}`, {
      error: { message: error.message, stack: error.stack },
      metadata: { context }
    })
}
