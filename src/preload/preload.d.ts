import { Game } from "@prisma/client"
import type { Creds } from "../types/creds"
import { AwsSdkError } from "../types/error"
import { FilterName, SortName } from "../types/menu"
import { InputGameData } from "../types/game"
import { ApiResult } from "../types/result"

export interface FileAPI {
  selectFile(filters: Electron.FileFilter[]): Promise<string | null>
  selectFolder(): Promise<string | null>
  validatePath(filePath: string, expectType?: string): Promise<ValidatePathResult>
}

export interface SaveDataUploadAPI {
  uploadSaveDataFolder(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<{ success: boolean }>
}

export interface saveDataFolderAPI {
  listRemoteSaveDataFolders(): Promise<string[] | null>
}

export interface SaveDataDownloadAPI {
  downloadSaveData(
    localSaveFolderPath: string,
    remoteSaveDataPath: string
  ): Promise<{ success: boolean }>
}

export interface CredentialAPI {
  upsertCredential(creds: Creds): Promise<{ success: boolean }>
  getCredential(): Promise<Creds | null>
  validateCredential(creds: Creds): Promise<{ success: boolean; err?: AwsSdkError }>
}

export interface DatabaseAPI {
  listGames(searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]>
  getGameById(game: InputGameData): Promise<Game | null>
  createGame(game: InputGameData): Promise<ApiResult>
  updateGame(id: number, game: InputGameData): Promise<ApiResult>
  deleteGame(id: number): Promise<ApiResult>
  createSession(duration: number, gameId: number): Promise<ApiResult>
}

export interface LoadImageAPI {
  loadImageFromLocal(filePath: string): Promise<string | null>
  loadImageFromWeb(url: string): Promise<string | null>
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
}
