export type GameType = {
  id: number
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
  saveFolderPath: string
  exePath: string
  imagePath: string
  playStatus: "unplayed" | "playing" | "played"
}
