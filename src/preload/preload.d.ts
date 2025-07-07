import { Game } from "@prisma/client"
import type { Creds } from "../types/creds"
import { AwsSdkError } from "../types/error"
import { FilterOption, SortOption } from "../types/menu"
import { InputGameData } from "../types/game"
import { ApiResult } from "../types/result"
import { ValidatePathResult } from "../types/file"
import { Chapter, ChapterStats, ChapterCreateInput, ChapterUpdateInput } from "../types/chapter"

export interface FileAPI {
  selectFile(filters: Electron.FileFilter[]): Promise<ApiResult<string | null>>
  selectFolder(): Promise<ApiResult<string | null>>
  validatePath(filePath: string, expectType?: string): Promise<ValidatePathResult>
}

export interface SaveDataUploadAPI {
  uploadSaveDataFolder(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>>
}

export interface SaveDataFolderAPI {
  listRemoteSaveDataFolders(): Promise<string[] | null>
}

export interface SaveDataDownloadAPI {
  downloadSaveData(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>>
  getCloudDataInfo(
    gameId: string
  ): Promise<ApiResult<{ exists: boolean; uploadedAt?: Date; size?: number; comment?: string }>>
  getCloudFileDetails(gameId: string): Promise<
    ApiResult<{
      exists: boolean
      totalSize: number
      files: Array<{
        name: string
        size: number
        lastModified: Date
        key: string
      }>
    }>
  >
}

export interface CredentialAPI {
  upsertCredential(creds: Creds): Promise<ApiResult<void>>
  getCredential(): Promise<ApiResult<Creds>>
  validateCredential(creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }>
}

export interface DatabaseAPI {
  listGames(searchWord: string, filter: FilterOption, sort: SortOption): Promise<Game[]>
  getGameById(id: string): Promise<Game | null>
  createGame(game: InputGameData): Promise<ApiResult<void>>
  updateGame(id: string, game: InputGameData): Promise<ApiResult<void>>
  deleteGame(id: string): Promise<ApiResult<void>>
  createSession(duration: number, gameId: string, sessionName?: string): Promise<ApiResult<void>>
  getPlaySessions(gameId: string): Promise<ApiResult<PlaySession[]>>
  updateSessionChapter(sessionId: string, chapterId: string | null): Promise<ApiResult<void>>
}

export interface LoadImageAPI {
  loadImageFromLocal(filePath: string): Promise<ApiResult<string>>
  loadImageFromWeb(url: string): Promise<ApiResult<string>>
}

export interface LaunchGameAPI {
  launchGame(filePath: string): Promise<ApiResult<void>>
  launchGameFromSteam(url: string, steamPath: string): Promise<ApiResult<void>>
}

export interface WindowAPI {
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  close(): Promise<void>
}

export interface MonitoringGameStatus {
  gameId: string
  gameTitle: string
  exeName: string
  isPlaying: boolean
  playTime: number
}

export interface ProcessMonitorAPI {
  startMonitoring(): Promise<ApiResult>
  stopMonitoring(): Promise<ApiResult>
  addGameToMonitor(gameId: string, gameTitle: string, exePath: string): Promise<ApiResult>
  removeGameFromMonitor(gameId: string): Promise<ApiResult>
  getMonitoringStatus(): Promise<MonitoringGameStatus[]>
  isMonitoring(): Promise<boolean>
  getGameProcesses(gameId: string): Promise<
    ApiResult<
      Array<{
        id: string
        name: string
        duration: number
        playedAt: Date
        isLinked: boolean
      }>
    >
  >
  deleteProcess(processId: string): Promise<ApiResult>
  setLinkedProcess(gameId: string, processId: string): Promise<ApiResult>
}

export interface ChapterAPI {
  getChapters(gameId: string): Promise<ApiResult<Chapter[]>>
  createChapter(input: ChapterCreateInput): Promise<ApiResult<Chapter>>
  updateChapter(chapterId: string, input: ChapterUpdateInput): Promise<ApiResult<Chapter>>
  deleteChapter(chapterId: string): Promise<ApiResult<void>>
  updateChapterOrders(
    gameId: string,
    chapterOrders: Array<{ id: string; order: number }>
  ): Promise<ApiResult<void>>
  getChapterStats(gameId: string): Promise<ApiResult<ChapterStats[]>>
  ensureDefaultChapter(gameId: string): Promise<ApiResult<Chapter>>
  setCurrentChapter(gameId: string, chapterId: string): Promise<ApiResult<void>>
}

export interface API {
  file: FileAPI
  window: WindowAPI
  saveData: {
    upload: SaveDataUploadAPI
    download: SaveDataDownloadAPI
    listFolders: SaveDataFolderAPI
  }
  credential: CredentialAPI
  database: DatabaseAPI
  loadImage: LoadImageAPI
  game: LaunchGameAPI
  processMonitor: ProcessMonitorAPI
  chapter: ChapterAPI
}
