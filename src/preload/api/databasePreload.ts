import { ipcRenderer } from "electron"

import type { InputGameData, PlaySessionType, GameType } from "../../types/game"
import type { FilterOption, SortOption, SortDirection } from "../../types/menu"
import type { ApiResult } from "../../types/result"
import type { PlayStatus } from "@prisma/client"

export const databaseAPI = {
  listGames: (
    searchWord: string,
    filter: FilterOption,
    sort: SortOption,
    sortDirection?: SortDirection
  ): Promise<GameType[]> =>
    ipcRenderer.invoke("game:list", searchWord, filter, sort, sortDirection),
  getGameById: (id: string): Promise<GameType | undefined> =>
    ipcRenderer.invoke("game:getById", id),
  createGame: (game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("game:create", game),
  updateGame: (id: string, game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("game:update", id, game),
  deleteGame: (id: string): Promise<ApiResult<void>> => ipcRenderer.invoke("game:delete", id),
  updatePlayStatus: (
    gameId: string,
    playStatus: PlayStatus,
    clearedAt?: Date
  ): Promise<ApiResult<GameType>> =>
    ipcRenderer.invoke("game:updatePlayStatus", gameId, playStatus, clearedAt),
  createSession: (
    duration: number,
    gameId: string,
    sessionName?: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("session:create", duration, gameId, sessionName),
  getPlaySessions: (gameId: string): Promise<ApiResult<PlaySessionType[]>> =>
    ipcRenderer.invoke("session:list", gameId),
  updateSessionChapter: (sessionId: string, chapterId: string | null): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("session:updateChapter", sessionId, chapterId),
  updateSessionName: (sessionId: string, sessionName: string): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("session:updateName", sessionId, sessionName),
  deletePlaySession: (sessionId: string): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("session:delete", sessionId)
}
