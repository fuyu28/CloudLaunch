/**
 * @fileoverview ゲーム管理IPCハンドラー
 *
 * このファイルは、フロントエンドからのゲーム操作リクエストを受け取り、
 * ゲームサービスに処理を委譲するIPCハンドラーを提供します。
 *
 * 責務：
 * - IPC通信の受信と基本的な入力検証
 * - サービス層への処理委譲
 * - レスポンスの形式変換
 */

import { ipcMain } from "electron"

import type { InputGameData, GameType, PlaySessionType } from "../../types/game"
import type { FilterOption, SortOption, SortDirection } from "../../types/menu"
import type { ApiResult } from "../../types/result"
import * as gameService from "../service/gameService"
import type { PlayStatus } from "@prisma/client"

type GameUpdateData = {
  title: string
  publisher: string
  saveFolderPath: string | null
  exePath: string
  imagePath: string | null
  playStatus: PlayStatus
  clearedAt?: Date | null
}

export function registerDatabaseHandlers(): void {
  /**
   * ゲーム一覧取得ハンドラー
   */
  ipcMain.handle(
    "game:list",
    async (
      _event,
      searchWord: string,
      filter: FilterOption,
      sort: SortOption,
      sortDirection: SortDirection = "desc"
    ): Promise<GameType[]> => {
      const result = await gameService.getGames(searchWord, filter, sort, sortDirection)
      return result.success ? result.data! : []
    }
  )

  /**
   * ゲーム詳細取得ハンドラー
   */
  ipcMain.handle("game:getById", async (_event, id: string): Promise<GameType | undefined> => {
    const result = await gameService.getGameById(id)
    return result.success ? result.data || undefined : undefined
  })

  /**
   * プレイセッション一覧取得ハンドラー
   */
  ipcMain.handle(
    "session:list",
    async (_event, gameId: string): Promise<ApiResult<PlaySessionType[]>> => {
      return await gameService.getPlaySessions(gameId)
    }
  )

  /**
   * ゲーム作成ハンドラー
   */
  ipcMain.handle(
    "game:create",
    async (_event, game: InputGameData): Promise<ApiResult<GameType>> => {
      return await gameService.createGame(game)
    }
  )

  /**
   * ゲーム更新ハンドラー
   */
  ipcMain.handle(
    "game:update",
    async (_event, id: string, game: InputGameData): Promise<ApiResult<GameType>> => {
      const updateData: GameUpdateData = {
        title: game.title,
        publisher: game.publisher,
        saveFolderPath: game.saveFolderPath || null,
        exePath: game.exePath,
        imagePath: game.imagePath || null,
        playStatus: game.playStatus,
        clearedAt: game.playStatus === "played" ? new Date() : null
      }

      return await gameService.updateGame(id, updateData)
    }
  )

  /**
   * ゲーム削除ハンドラー
   */
  ipcMain.handle("game:delete", async (_event, gameId: string): Promise<ApiResult<boolean>> => {
    return await gameService.deleteGame(gameId)
  })

  /**
   * プレイセッション記録ハンドラー
   */
  ipcMain.handle(
    "session:create",
    async (_event, duration: number, gameId: string): Promise<ApiResult<PlaySessionType>> => {
      return await gameService.recordPlaySession(gameId, {
        playTime: duration,
        playedAt: new Date()
      })
    }
  )

  /**
   * プレイステータス更新ハンドラー
   */
  ipcMain.handle(
    "game:updatePlayStatus",
    async (
      _event,
      gameId: string,
      playStatus: PlayStatus,
      clearedAt?: Date
    ): Promise<ApiResult<GameType>> => {
      return await gameService.updatePlayStatus(gameId, playStatus, clearedAt)
    }
  )

  /**
   * セッション章更新ハンドラー
   */
  ipcMain.handle(
    "session:updateChapter",
    async (_event, sessionId: string, chapterId: string | null): Promise<ApiResult<boolean>> => {
      return await gameService.updateSessionChapter(sessionId, chapterId)
    }
  )

  /**
   * セッション名更新ハンドラー
   */
  ipcMain.handle(
    "session:updateName",
    async (_event, sessionId: string, sessionName: string): Promise<ApiResult<boolean>> => {
      return await gameService.updateSessionName(sessionId, sessionName)
    }
  )

  /**
   * プレイセッション削除ハンドラー
   */
  ipcMain.handle(
    "session:delete",
    async (_event, sessionId: string): Promise<ApiResult<boolean>> => {
      return await gameService.deletePlaySession(sessionId)
    }
  )
}
