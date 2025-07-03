import { ipcRenderer } from "electron"
import { FilterName, SortName } from "../../types/menu"
import { Game } from "@prisma/client"
import { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"

export const databaseAPI = {
  listGames: (searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]> =>
    ipcRenderer.invoke("list-games", searchWord, filter, sort),
  getGameById: (id: number): Promise<Game | null> => ipcRenderer.invoke("get-game-by-id", id),
  createGame: (game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("create-game", game),
  updateGame: (id: number, game: InputGameData): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("update-game", id, game),
  deleteGame: (id: number): Promise<ApiResult<void>> => ipcRenderer.invoke("delete-game", id),
  createSession: (duration: number, gameId: number): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("create-session", duration, gameId)
}
