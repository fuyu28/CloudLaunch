/**
 * @fileoverview ゲーム管理に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのゲーム操作リクエストを処理します。
 * - ゲーム一覧の取得（検索・フィルタ・ソート機能付き）
 * - ゲーム詳細情報の取得
 * - ゲームの作成・更新・削除
 * - プレイセッションの記録とプレイ時間の管理
 *
 * すべての操作はPrismaを通してSQLiteデータベースに対して実行されます。
 * エラーハンドリングではPrismaの既知エラー（重複エラーなど）を適切に処理し、
 * ユーザーフレンドリーなメッセージを返します。
 */

import { Game } from "@prisma/client"
import { ipcMain } from "electron"
import { prisma } from "../db"
import { Prisma } from "@prisma/client"
import type { FilterOption, SortOption } from "../../types/menu"
import type { InputGameData } from "../../types/game"
import { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"

const filterMap: Record<FilterOption, Prisma.GameWhereInput> = {
  all: {},
  unplayed: { playStatus: "unplayed" },
  playing: { playStatus: "playing" },
  played: { playStatus: "played" }
}
const sortMap: Record<SortOption, { [key: string]: "asc" | "desc" }> = {
  title: { title: "asc" },
  recentlyPlayed: { lastPlayed: "desc" },
  longestPlayed: { totalPlayTime: "desc" },
  recentlyRegistered: { createdAt: "desc" }
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle(
    "list-games",
    async (_event, searchWord: string, filter: FilterOption, sort: SortOption): Promise<Game[]> => {
      try {
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
      } catch (error) {
        logger.error("ゲーム一覧取得エラー:", error)
        return []
      }
    }
  )

  ipcMain.handle("get-game-by-id", async (_event, id: string): Promise<Game | null> => {
    try {
      return prisma.game.findFirst({
        where: { id }
      })
    } catch (error) {
      logger.error("ゲーム詳細取得エラー:", error)
      return null
    }
  })

  ipcMain.handle("create-game", async (_event, game: InputGameData): Promise<ApiResult> => {
    try {
      await prisma.game.create({
        data: {
          title: game.title,
          publisher: game.publisher,
          saveFolderPath: game.saveFolderPath ?? null,
          exePath: game.exePath,
          imagePath: game.imagePath ?? null
        }
      })
      return { success: true }
    } catch (error) {
      logger.error("ゲーム作成エラー:", error)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { success: false, message: `ゲーム「${game.title}」は既に存在します。` }
      }
      return { success: false, message: "ゲームの作成に失敗しました。" }
    }
  })

  ipcMain.handle(
    "update-game",
    async (_event, id: string, game: InputGameData): Promise<ApiResult> => {
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
      } catch (error) {
        logger.error("ゲーム更新エラー:", error)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { success: false, message: `ゲーム「${game.title}」は既に存在します。` }
        }
        return { success: false, message: "ゲームの更新に失敗しました。" }
      }
    }
  )

  ipcMain.handle("delete-game", async (_event, gameId: string): Promise<ApiResult> => {
    try {
      await prisma.game.delete({
        where: { id: gameId }
      })
      return { success: true }
    } catch (error) {
      logger.error("ゲーム削除エラー:", error)
      return { success: false, message: "ゲームの削除に失敗しました。" }
    }
  })

  ipcMain.handle(
    "create-session",
    async (_event, duration: number, gameId: string): Promise<ApiResult> => {
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
      } catch (error) {
        logger.error("プレイセッション作成エラー:", error)
        return { success: false, message: "プレイ時間の記録に失敗しました。" }
      }
    }
  )
}
