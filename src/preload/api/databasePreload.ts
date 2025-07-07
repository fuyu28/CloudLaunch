import { ipcRenderer } from "electron"
import { FilterOption, SortOption } from "../../types/menu"
import { Game, PlaySession } from "@prisma/client"
import { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"

export const databaseAPI = {
  listGames: (searchWord: string, filter: FilterOption, sort: SortOption): Promise<Game[]> =>
    ipcRenderer.invoke("list-games", searchWord, filter, sort),
  getGameById: (id: string): Promise<Game | null> => ipcRenderer.invoke("get-game-by-id", id),
  createGame: (game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("create-game", game),
  updateGame: (id: string, game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("update-game", id, game),
  deleteGame: (id: string): Promise<ApiResult<void>> => ipcRenderer.invoke("delete-game", id),
  createSession: (
    duration: number,
    gameId: string,
    sessionName?: string
  ): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("create-session", duration, gameId, sessionName),
  getPlaySessions: (gameId: string): Promise<ApiResult<PlaySession[]>> =>
    ipcRenderer.invoke("get-play-sessions", gameId),
  updateSessionChapter: (sessionId: string, chapterId: string | null): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("update-session-chapter", sessionId, chapterId)
}
