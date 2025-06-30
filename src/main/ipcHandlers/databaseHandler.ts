import { Game } from "@prisma/client"
import { ipcMain } from "electron"
import { prisma } from "../db"
import type { Prisma } from "@prisma/client"
import type { FilterName, SortName } from "../../types/menu"
import type { GameType } from "../../types/game"
import { ApiResult } from "../../types/result"

const filterMap: Record<FilterName, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}
const sortMap: Record<SortName, { [key: string]: "asc" | "desc" }> = {
  title: { title: "asc" },
  recentlyPlayed: { lastPlayed: "asc" },
  longestPlayed: { totalPlayTime: "desc" },
  recentlyRegistered: { createdAt: "desc" }
}

export function registerDatabaseHandler(): void {
  ipcMain.handle(
    "get-game-list",
    async (_event, searchWord: string, filter: FilterName, sort: SortName): Promise<Game[]> => {
      // 文字検索
      const searchCondition: Prisma.GameWhereInput = searchWord
        ? {
            OR: [{ title: { contains: searchWord } }, { publisher: { contains: searchWord } }]
          }
        : {}

      // フィルター指定
      const filterCondition = filterMap[filter]

      // ソート順指定
      const orderBy = sortMap[sort]

      return prisma.game.findMany({
        where: {
          AND: [searchCondition, filterCondition]
        },
        orderBy
      })
    }
  )

  ipcMain.handle("add-game", async (_event, game: GameType): Promise<ApiResult> => {
    try {
      await prisma.game.create({
        data: {
          title: game.title,
          publisher: game.publisher,
          folderPath: game.folderPath,
          exePath: game.exePath,
          imagePath: game.imagePath
        }
      })
      return { success: true }
    } catch (e) {
      console.error(e)
      return { success: false, message: `${e}` }
    }
  })

  ipcMain.handle(
    "add-session",
    async (_event, duration: number, gameId: number): Promise<ApiResult> => {
      try {
        await prisma.playSession.create({
          data: {
            duration,
            gameId
          }
        })
        return { success: true }
      } catch (e) {
        console.error(e)
        return { success: false, message: `${e}` }
      }
    }
  )
}
