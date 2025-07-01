import { ipcRenderer } from "electron"
import { FilterName, SortName } from "../../types/menu"
import { Game } from "@prisma/client"
import { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"

export const databaseAPI = {
  getGameList: (searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]> =>
    ipcRenderer.invoke("get-game-list", searchWord, filter, sort),
  addGame: (game: InputGameData): Promise<ApiResult> => ipcRenderer.invoke("add-game", game),
  addSession: (duration: number, gameId: number): Promise<ApiResult> =>
    ipcRenderer.invoke("add-session", duration, gameId)
}
