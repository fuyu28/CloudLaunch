import type {
  ExportOptions,
  ImportOptions,
  ImportResult,
  ImportFormat
} from "../main/ipcHandlers/dataExportHandlers"
import type {
  Chapter,
  ChapterStats,
  ChapterCreateInput,
  ChapterUpdateInput
} from "../types/chapter"
import type { CloudDataItem, CloudFileDetail, CloudDirectoryNode } from "../types/cloud"
import type { Creds } from "../types/creds"
import type { AwsSdkError } from "../types/error"
import type { ValidatePathResult } from "../types/file"
import type { InputGameData, PlaySessionType, MonitoringGameStatus } from "../types/game"
import type {
  MemoType,
  CreateMemoData,
  UpdateMemoData,
  CloudMemoInfo,
  MemoSyncResult
} from "../types/memo"
import type { FilterOption, SortOption, SortDirection } from "../types/menu"
import type { ApiResult } from "../types/result"
import type { Game } from "@prisma/client"

export type FileAPI = {
  selectFile(filters: Electron.FileFilter[]): Promise<ApiResult<string | undefined>>
  selectFolder(): Promise<ApiResult<string | undefined>>
  validatePath(filePath: string, expectType?: string): Promise<ValidatePathResult>
  checkFileExists(filePath: string): Promise<boolean>
  checkDirectoryExists(dirPath: string): Promise<boolean>
  openLogsDirectory(): Promise<ApiResult<void>>
  getLogFilePath(): Promise<ApiResult<string>>
}

export type SaveDataUploadAPI = {
  uploadSaveDataFolder(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>>
}

export type SaveDataFolderAPI = {
  listRemoteSaveDataFolders(): Promise<string[] | undefined>
}

export type SaveDataDownloadAPI = {
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

export type CredentialAPI = {
  upsertCredential(creds: Creds): Promise<ApiResult<void>>
  getCredential(): Promise<ApiResult<Creds>>
  validateCredential(creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }>
}

export type DatabaseAPI = {
  listGames(
    searchWord: string,
    filter: FilterOption,
    sort: SortOption,
    sortDirection?: SortDirection
  ): Promise<Game[]>
  getGameById(id: string): Promise<Game | undefined>
  createGame(game: InputGameData): Promise<ApiResult<void>>
  updateGame(id: string, game: InputGameData): Promise<ApiResult<void>>
  deleteGame(id: string): Promise<ApiResult<void>>
  createSession(duration: number, gameId: string, sessionName?: string): Promise<ApiResult<void>>
  getPlaySessions(gameId: string): Promise<ApiResult<PlaySessionType[]>>
  updateSessionChapter(sessionId: string, chapterId: string | null): Promise<ApiResult<void>>
  updateSessionName(sessionId: string, sessionName: string): Promise<ApiResult<void>>
  deletePlaySession(sessionId: string): Promise<ApiResult<void>>
}

export type LoadImageAPI = {
  loadImageFromLocal(filePath: string): Promise<ApiResult<string>>
  loadImageFromWeb(url: string): Promise<ApiResult<string>>
}

export type LaunchGameAPI = {
  launchGame(filePath: string): Promise<ApiResult<void>>
  launchGameFromSteam(url: string, steamPath: string): Promise<ApiResult<void>>
}

export type WindowAPI = {
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  close(): Promise<void>
  openFolder(folderPath: string): Promise<{ success: boolean; message?: string }>
}

export type ProcessMonitorAPI = {
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

export type ChapterAPI = {
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

export type SettingsAPI = {
  updateAutoTracking(enabled: boolean): Promise<ApiResult>
  getAutoTracking(): Promise<ApiResult<boolean>>
}

export type MemoAPI = {
  getMemosByGameId(gameId: string): Promise<ApiResult<MemoType[]>>
  getMemoById(memoId: string): Promise<ApiResult<MemoType | null>>
  createMemo(memoData: CreateMemoData): Promise<ApiResult<MemoType>>
  updateMemo(memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>>
  deleteMemo(memoId: string): Promise<ApiResult<boolean>>
  getMemoFilePath(memoId: string): Promise<ApiResult<string>>
  getGameMemoDir(gameId: string): Promise<ApiResult<string>>
  getAllMemos(): Promise<ApiResult<MemoType[]>>
  getMemoRootDir(): Promise<ApiResult<string>>
  uploadMemoToCloud(memoId: string): Promise<ApiResult<boolean>>
  downloadMemoFromCloud(gameTitle: string, memoFileName: string): Promise<ApiResult<string>>
  getCloudMemos(): Promise<ApiResult<CloudMemoInfo[]>>
  syncMemosFromCloud(gameId?: string): Promise<ApiResult<MemoSyncResult>>
}

export type CloudDataAPI = {
  listCloudData(): Promise<ApiResult<CloudDataItem[]>>
  deleteCloudData(remotePath: string): Promise<ApiResult>
  getCloudFileDetails(remotePath: string): Promise<ApiResult<CloudFileDetail[]>>
  getDirectoryTree(): Promise<ApiResult<CloudDirectoryNode[]>>
  deleteFile(objectKey: string): Promise<ApiResult>
}

export type ErrorReportAPI = {
  reportError(errorReport: {
    message: string
    stack: string
    componentStack?: string
    context?: string
    timestamp: string
    url?: string
    userAgent?: string
  }): Promise<ApiResult>
  reportLog(logReport: {
    level: "debug" | "info" | "warn" | "error"
    message: string
    component?: string
    function?: string
    context?: string
    data?: unknown
    timestamp: string
  }): Promise<ApiResult>
  getErrorStats(): Promise<
    ApiResult<{
      totalErrors: number
      errorsByCategory: Record<string, number>
      errorsBySeverity: Record<string, number>
      lastError?: {
        code: string
        message: string
        context?: string
        stack?: string
        timestamp: Date
        userMessage: string
      }
    }>
  >
  resetErrorStats(): Promise<ApiResult>
  getLogPath(): Promise<ApiResult<string>>
  openLogDirectory(): Promise<ApiResult>
  rotateLog(): Promise<ApiResult>
  cleanupLogs(): Promise<ApiResult>
}

export type DataExportAPI = {
  exportData(options: ExportOptions): Promise<ApiResult<string>>
  getExportStats(): Promise<
    ApiResult<{
      gamesCount: number
      playSessionsCount: number
      uploadsCount: number
      chaptersCount: number
      memosCount: number
    }>
  >
  importData(options: ImportOptions): Promise<
    ApiResult<{
      analysis: {
        format: ImportFormat | null
        recordCounts: Record<string, number>
        hasValidStructure: boolean
      }
      importResult?: ImportResult
      filePath: string
    }>
  >
  analyzeImportFile(): Promise<
    ApiResult<{
      format: ImportFormat | null
      recordCounts: Record<string, number>
      hasValidStructure: boolean
    }>
  >
}

export type API = {
  file: FileAPI
  window: WindowAPI
  saveData: {
    upload: SaveDataUploadAPI
    download: SaveDataDownloadAPI
    listFolders: SaveDataFolderAPI
  }
  cloudData: CloudDataAPI
  credential: CredentialAPI
  database: DatabaseAPI
  dataExport: DataExportAPI
  loadImage: LoadImageAPI
  game: LaunchGameAPI
  processMonitor: ProcessMonitorAPI
  chapter: ChapterAPI
  settings: SettingsAPI
  memo: MemoAPI
  errorReport: ErrorReportAPI
}
