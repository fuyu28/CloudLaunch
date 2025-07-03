import { Game } from "@prisma/client"
import { ipcMain } from "electron"
import { prisma } from "../db"
import { Prisma } from "@prisma/client"
import type { FilterName, SortName } from "../../types/menu"
import type { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"

const filterMap: Record<FilterName, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}
const sortMap: Record<SortName, { [key: string]: "asc" | "desc" }> = {
  title: { title: "asc" },
  recentlyPlayed: { lastPlayed: "desc" },
  longestPlayed: { totalPlayTime: "desc" },
  recentlyRegistered: { createdAt: "desc" }
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle(
    "list-games",
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

  ipcMain.handle("get-game-by-id", async (_event, id: number): Promise<Game | null> => {
    return prisma.game.findFirst({
      where: { id }
    })
  })

  ipcMain.handle("create-game", async (_event, game: InputGameData): Promise<ApiResult> => {
    try {
      await prisma.game.create({
        data: {
          title: game.title,
          publisher: game.publisher,
          saveFolderPath: game.saveFolderPath,
          exePath: game.exePath,
          imagePath: game.imagePath
        }
      })
      return { success: true }
    } catch (e) {
      console.error(e)
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return { success: false, message: `ゲーム「${game.title}」は既に存在します。` }
      }
      return { success: false, message: "ゲームの作成に失敗しました。" }
    }
  })

  ipcMain.handle(
    "update-game",
    async (_event, id: number, game: InputGameData): Promise<ApiResult> => {
      try {
        await prisma.game.update({
          where: {
            id
          },
          data: {
            title: game.title,
            publisher: game.publisher,
            saveFolderPath: game.saveFolderPath,
            exePath: game.exePath,
            imagePath: game.imagePath
          }
        })
        return { success: true }
      } catch (e) {
        console.error(e)
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return { success: false, message: `ゲーム「${game.title}」は既に存在します。` }
        }
        return { success: false, message: "ゲームの更新に失敗しました。" }
      }
    }
  )

  ipcMain.handle("delete-game", async (_event, gameId: number): Promise<ApiResult> => {
    try {
      await prisma.game.delete({
        where: { id: gameId }
      })
      return { success: true }
    } catch (e) {
      console.error(e)
      return { success: false, message: "ゲームの削除に失敗しました。" }
    }
  })

  ipcMain.handle(
    "create-session",
    async (_event, duration: number, gameId: number): Promise<ApiResult> => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.playSession.create({
            data: {
              duration,
              gameId
            }
          })

          const game = await tx.game.findUnique({
            where: { id: gameId }
          })

          if (game) {
            await tx.game.update({
              where: { id: gameId },
              data: {
                totalPlayTime: { increment: duration },
                lastPlayed: new Date()
              }
            })
          }
        })
        return { success: true }
      } catch (e) {
        console.error(e)
        return { success: false, message: "プレイ時間の記録に失敗しました。" }
      }
    }
  )
}
