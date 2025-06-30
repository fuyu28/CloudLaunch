export type GameType = {
  id: number
  title: string
  publisher: string
  folderPath: string
  exePath: string
  imagePath: string | null
  createdAt: Date
  playStatus: "unplayed" | "playing" | "played"
  totalPlayTime: number
  lastPlayed: Date | null
}
