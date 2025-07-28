import type { PlayStatus } from "@prisma/client"

export type GameType = {
  id: string
  title: string
  publisher: string
  saveFolderPath?: string // undefined - オプショナル設定
  exePath: string
  imagePath?: string // undefined - オプショナル設定
  createdAt: Date
  playStatus: PlayStatus
  totalPlayTime: number
  lastPlayed: Date | null // null - 明確な「未プレイ」状態
  clearedAt: Date | null // null - 明確な「未クリア」状態
  currentChapter: string | null // null - 明確な「未選択」状態
}

export type InputGameData = {
  title: string
  publisher: string
  imagePath?: string
  exePath: string
  saveFolderPath?: string
  playStatus: PlayStatus
}

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

export type PlaySessionType = {
  id: string
  sessionName?: string // undefined - オプショナル情報
  playedAt: Date
  duration: number
  gameId: string
  chapterId: string | null // null - 明確な「未所属」状態
  chapter?: {
    // undefined - オプショナル情報
    name: string
    id: string
    order: number
  }
}
