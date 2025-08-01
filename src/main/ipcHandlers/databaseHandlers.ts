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
import {
  InputGameDataSchema,
  UuidSchema,
  SearchWordSchema,
  FilterOptionSchema,
  SortOptionSchema,
  SortDirectionSchema,
  PlayTimeSchema,
  PlayStatusSchema,
  SessionNameSchema,
  validateDatabaseInput
} from "../service/validation/databaseSchemas"
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
      // パラメータのバリデーション
      const searchValidation = validateDatabaseInput(SearchWordSchema, searchWord)
      if (!searchValidation.success) {
        console.warn(`検索キーワードが無効です: ${searchValidation.errors.join(", ")}`)
        return []
      }

      const filterValidation = validateDatabaseInput(FilterOptionSchema, filter)
      if (!filterValidation.success) {
        console.warn(`フィルターオプションが無効です: ${filterValidation.errors.join(", ")}`)
        return []
      }

      const sortValidation = validateDatabaseInput(SortOptionSchema, sort)
      if (!sortValidation.success) {
        console.warn(`ソートオプションが無効です: ${sortValidation.errors.join(", ")}`)
        return []
      }

      const sortDirectionValidation = validateDatabaseInput(SortDirectionSchema, sortDirection)
      if (!sortDirectionValidation.success) {
        console.warn(`ソート方向が無効です: ${sortDirectionValidation.errors.join(", ")}`)
        return []
      }

      const result = await gameService.getGames(
        searchValidation.data,
        filterValidation.data,
        sortValidation.data,
        sortDirectionValidation.data
      )
      return result.success ? result.data! : []
    }
  )

  /**
   * ゲーム詳細取得ハンドラー
   */
  ipcMain.handle("game:getById", async (_event, id: string): Promise<GameType | undefined> => {
    // IDのバリデーション
    const validation = validateDatabaseInput(UuidSchema, id)
    if (!validation.success) {
      console.warn(`ゲームIDが無効です: ${validation.errors.join(", ")}`)
      return undefined
    }

    const result = await gameService.getGameById(validation.data)
    return result.success ? result.data || undefined : undefined
  })

  /**
   * プレイセッション一覧取得ハンドラー
   */
  ipcMain.handle(
    "session:list",
    async (_event, gameId: string): Promise<ApiResult<PlaySessionType[]>> => {
      // ゲームIDのバリデーション
      const validation = validateDatabaseInput(UuidSchema, gameId)
      if (!validation.success) {
        return {
          success: false,
          message: `ゲームIDが無効です: ${validation.errors.join(", ")}`
        }
      }

      return await gameService.getPlaySessions(validation.data)
    }
  )

  /**
   * ゲーム作成ハンドラー
   */
  ipcMain.handle(
    "game:create",
    async (_event, game: InputGameData): Promise<ApiResult<GameType>> => {
      // zodバリデーション
      const validation = validateDatabaseInput(InputGameDataSchema, game)
      if (!validation.success) {
        return {
          success: false,
          message: `入力データが無効です: ${validation.errors.join(", ")}`
        }
      }

      return await gameService.createGame(validation.data)
    }
  )

  /**
   * ゲーム更新ハンドラー
   */
  ipcMain.handle(
    "game:update",
    async (_event, id: string, game: InputGameData): Promise<ApiResult<GameType>> => {
      // IDのバリデーション
      const idValidation = validateDatabaseInput(UuidSchema, id)
      if (!idValidation.success) {
        return {
          success: false,
          message: `ゲームIDが無効です: ${idValidation.errors.join(", ")}`
        }
      }

      // ゲームデータのバリデーション
      const gameValidation = validateDatabaseInput(InputGameDataSchema, game)
      if (!gameValidation.success) {
        return {
          success: false,
          message: `入力データが無効です: ${gameValidation.errors.join(", ")}`
        }
      }

      const updateData: GameUpdateData = {
        title: gameValidation.data.title,
        publisher: gameValidation.data.publisher,
        saveFolderPath: gameValidation.data.saveFolderPath || null,
        exePath: gameValidation.data.exePath,
        imagePath: gameValidation.data.imagePath || null,
        playStatus: gameValidation.data.playStatus,
        clearedAt: gameValidation.data.playStatus === "played" ? new Date() : null
      }

      return await gameService.updateGame(idValidation.data, updateData)
    }
  )

  /**
   * ゲーム削除ハンドラー
   */
  ipcMain.handle("game:delete", async (_event, gameId: string): Promise<ApiResult<boolean>> => {
    // ゲームIDのバリデーション
    const validation = validateDatabaseInput(UuidSchema, gameId)
    if (!validation.success) {
      return {
        success: false,
        message: `ゲームIDが無効です: ${validation.errors.join(", ")}`
      }
    }

    return await gameService.deleteGame(validation.data)
  })

  /**
   * プレイセッション記録ハンドラー
   */
  ipcMain.handle(
    "session:create",
    async (_event, duration: number, gameId: string): Promise<ApiResult<PlaySessionType>> => {
      // プレイ時間のバリデーション
      const durationValidation = validateDatabaseInput(PlayTimeSchema, duration)
      if (!durationValidation.success) {
        return {
          success: false,
          message: `プレイ時間が無効です: ${durationValidation.errors.join(", ")}`
        }
      }

      // ゲームIDのバリデーション
      const gameIdValidation = validateDatabaseInput(UuidSchema, gameId)
      if (!gameIdValidation.success) {
        return {
          success: false,
          message: `ゲームIDが無効です: ${gameIdValidation.errors.join(", ")}`
        }
      }

      return await gameService.recordPlaySession(gameIdValidation.data, {
        playTime: durationValidation.data,
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
      // ゲームIDのバリデーション
      const gameIdValidation = validateDatabaseInput(UuidSchema, gameId)
      if (!gameIdValidation.success) {
        return {
          success: false,
          message: `ゲームIDが無効です: ${gameIdValidation.errors.join(", ")}`
        }
      }

      // プレイステータスのバリデーション
      const playStatusValidation = validateDatabaseInput(PlayStatusSchema, playStatus)
      if (!playStatusValidation.success) {
        return {
          success: false,
          message: `プレイステータスが無効です: ${playStatusValidation.errors.join(", ")}`
        }
      }

      return await gameService.updatePlayStatus(
        gameIdValidation.data,
        playStatusValidation.data,
        clearedAt
      )
    }
  )

  /**
   * セッション章更新ハンドラー
   */
  ipcMain.handle(
    "session:updateChapter",
    async (_event, sessionId: string, chapterId: string | null): Promise<ApiResult<boolean>> => {
      // セッションIDのバリデーション
      const sessionIdValidation = validateDatabaseInput(UuidSchema, sessionId)
      if (!sessionIdValidation.success) {
        return {
          success: false,
          message: `セッションIDが無効です: ${sessionIdValidation.errors.join(", ")}`
        }
      }

      // チャプターIDのバリデーション（nullの場合は許可）
      if (chapterId !== null) {
        const chapterIdValidation = validateDatabaseInput(UuidSchema, chapterId)
        if (!chapterIdValidation.success) {
          return {
            success: false,
            message: `チャプターIDが無効です: ${chapterIdValidation.errors.join(", ")}`
          }
        }
        return await gameService.updateSessionChapter(
          sessionIdValidation.data,
          chapterIdValidation.data
        )
      }

      return await gameService.updateSessionChapter(sessionIdValidation.data, null)
    }
  )

  /**
   * セッション名更新ハンドラー
   */
  ipcMain.handle(
    "session:updateName",
    async (_event, sessionId: string, sessionName: string): Promise<ApiResult<boolean>> => {
      // セッションIDのバリデーション
      const sessionIdValidation = validateDatabaseInput(UuidSchema, sessionId)
      if (!sessionIdValidation.success) {
        return {
          success: false,
          message: `セッションIDが無効です: ${sessionIdValidation.errors.join(", ")}`
        }
      }

      // セッション名のバリデーション
      const sessionNameValidation = validateDatabaseInput(SessionNameSchema, sessionName)
      if (!sessionNameValidation.success) {
        return {
          success: false,
          message: `セッション名が無効です: ${sessionNameValidation.errors.join(", ")}`
        }
      }

      return await gameService.updateSessionName(
        sessionIdValidation.data,
        sessionNameValidation.data
      )
    }
  )

  /**
   * プレイセッション削除ハンドラー
   */
  ipcMain.handle(
    "session:delete",
    async (_event, sessionId: string): Promise<ApiResult<boolean>> => {
      // セッションIDのバリデーション
      const validation = validateDatabaseInput(UuidSchema, sessionId)
      if (!validation.success) {
        return {
          success: false,
          message: `セッションIDが無効です: ${validation.errors.join(", ")}`
        }
      }

      return await gameService.deletePlaySession(validation.data)
    }
  )
}
