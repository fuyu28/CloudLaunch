import { Game } from "@prisma/client"
import type { Creds } from "../types/creds"
import { AwsSdkError } from "../types/error"
import { FilterName, SortName } from "../types/menu"
import { InputGameData } from "../types/game"
import { ApiResult } from "../types/result"

export interface FileDialogAPI {
  selectExe(): Promise<string | null>
  selectFolder(): Promise<string | null>
}

export interface UploadAPI {
  uploadFolder(
    localsaveFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }>
}

export interface GetR2ListAPI {
  getR2FolderList(): Promise<string[] | null>
}

export interface DownloadAPI {
  downloadFolder(
    localsaveFolderPath: string,
    r2DestinationPath: string
  ): Promise<{ success: boolean }>
}

export interface CredentialAPI {
  setCredential(creds: Creds): Promise<{ success: boolean }>
  getCredential(): Promise<Creds | null>
  testCredential(creds: Creds): Promise<{ success: boolean; err?: AwsSdkError }>
}

export interface DatabaseAPI {
  getGameList(searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]>
  addGame(game: InputGameData): Promise<ApiResult>
  addSession(duration: number, gameId: number): Promise<ApiResult>
}

export interface API {
  fileDialog: FileDialogAPI
  upload: UploadAPI
  getR2FolderList: GetR2ListAPI
  download: DownloadAPI
  credential: CredentialAPI
  database: DatabaseAPI
}
