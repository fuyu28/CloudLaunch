import { Game } from "@prisma/client"
import type { Creds } from "../types/creds"
import { AwsSdkError } from "../types/error"
import { FilterName, SortName } from "../types/menu"
import { InputGameData } from "../types/game"
import { ApiResult } from "../types/result"
import { ValidatePathResult } from "../types/file"

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

export interface saveDataFolderAPI {
  listRemoteSaveDataFolders(): Promise<string[] | null>
}

export interface SaveDataDownloadAPI {
  downloadSaveData(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<ApiResult<void>>
}

export interface CredentialAPI {
  upsertCredential(creds: Creds): Promise<ApiResult<void>>
  getCredential(): Promise<Creds | null>
  validateCredential(creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }>
}

export interface DatabaseAPI {
  listGames(searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]>
  getGameById(id: number): Promise<Game | null>
  createGame(game: InputGameData): Promise<ApiResult<void>>
  updateGame(id: number, game: InputGameData): Promise<ApiResult<void>>
  deleteGame(id: number): Promise<ApiResult<void>>
  createSession(duration: number, gameId: number): Promise<ApiResult<void>>
}

export interface LoadImageAPI {
  loadImageFromLocal(filePath: string): Promise<ApiResult<string>>
  loadImageFromWeb(url: string): Promise<ApiResult<string>>
}

export interface LaunchGameAPI {
  launchGame(filePath: string): Promise<ApiResult<void>>
  launchGameFromSteam(url: string, steamPath: string): Promise<ApiResult<void>>
}

export interface API {
  file: FileAPI
  saveData: {
    upload: SaveDataUploadAPI
    download: SaveDataDownloadAPI
    listFolders: SaveDataFolderAPI
  }
  credential: CredentialAPI
  database: DatabaseAPI
  loadImage: LoadImageAPI
  game: LaunchGameAPI
}
