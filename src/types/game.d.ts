export type GameType = {
  id: string
  title: string
  publisher: string
  saveFolderPath: string | null
  exePath: string
  imagePath: string | null
  createdAt: Date
  playStatus: "unplayed" | "playing" | "played"
  totalPlayTime: number
  lastPlayed: Date | null
  currentChapter: string | null
}

export type InputGameData = {
  title: string
  publisher: string
  imagePath?: string
  exePath: string
  saveFolderPath?: string
  playStatus: "unplayed" | "playing" | "played"
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
  sessionName: string | null
  playedAt: Date
  duration: number
  gameId: string
  chapterId: string | null
  chapter: {
    name: string
    id: string
    order: number
  } | null
}
