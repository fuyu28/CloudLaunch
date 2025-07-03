export type GameType = {
  id: string
  title: string
  publisher: string
  saveFolderPath: string
  exePath: string
  imagePath: string | null
  createdAt: Date
  playStatus: "unplayed" | "playing" | "played"
  totalPlayTime: number
  lastPlayed: Date | null
}

export type InputGameData = {
  title: string
  publisher: string
  imagePath?: string
  exePath: string
  saveFolderPath?: string
  playStatus: "unplayed" | "playing" | "played"
}
