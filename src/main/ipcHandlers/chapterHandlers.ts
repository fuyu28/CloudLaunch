/**
 * @fileoverview 章管理関連のIPCハンドラー
 *
 * このハンドラーは、フロントエンドからの章管理リクエストを受け取り、
 * 章サービスに処理を委譲するIPCハンドラーを提供します。
 *
 * 責務：
 * - IPC通信の受信と基本的な入力検証
 * - サービス層への処理委譲
 * - レスポンスの形式変換
 */

import { ipcMain } from "electron"

import type {
  Chapter,
  ChapterStats,
  ChapterCreateInput,
  ChapterUpdateInput
} from "../../types/chapter"
import type { ApiResult } from "../../types/result"
import * as chapterService from "../service/chapterService"

/**
 * 章管理関連のIPCハンドラーを登録します
 */
export const registerChapterHandlers = (): void => {
  /**
   * 章一覧を取得します
   */
  ipcMain.handle(
    "chapter:getChapters",
    async (_, gameId: string): Promise<ApiResult<Chapter[]>> => {
      return await chapterService.getChapters(gameId)
    }
  )

  /**
   * 新しい章を作成します
   */
  ipcMain.handle(
    "chapter:createChapter",
    async (_, input: ChapterCreateInput): Promise<ApiResult<Chapter>> => {
      return await chapterService.createChapter(input)
    }
  )

  /**
   * 章を更新します
   */
  ipcMain.handle(
    "chapter:updateChapter",
    async (_, chapterId: string, input: ChapterUpdateInput): Promise<ApiResult<Chapter>> => {
      return await chapterService.updateChapter(chapterId, input)
    }
  )

  /**
   * 章を削除します
   */
  ipcMain.handle(
    "chapter:deleteChapter",
    async (_, chapterId: string): Promise<ApiResult<boolean>> => {
      return await chapterService.deleteChapter(chapterId)
    }
  )

  /**
   * 章の順序を更新します
   */
  ipcMain.handle(
    "chapter:updateChapterOrders",
    async (
      _,
      gameId: string,
      chapterOrders: Array<{ id: string; order: number }>
    ): Promise<ApiResult<boolean>> => {
      return await chapterService.updateChapterOrders(gameId, chapterOrders)
    }
  )

  /**
   * 章統計データを取得します
   */
  ipcMain.handle(
    "chapter:getChapterStats",
    async (_, gameId: string): Promise<ApiResult<ChapterStats[]>> => {
      return await chapterService.getChapterStats(gameId)
    }
  )

  /**
   * デフォルト章を作成します
   */
  ipcMain.handle(
    "chapter:ensureDefaultChapter",
    async (_, gameId: string): Promise<ApiResult<Chapter>> => {
      return await chapterService.ensureDefaultChapter(gameId)
    }
  )

  /**
   * 現在の章を設定します
   */
  ipcMain.handle(
    "chapter:setCurrentChapter",
    async (_, gameId: string, chapterId: string): Promise<ApiResult<boolean>> => {
      return await chapterService.setCurrentChapter(gameId, chapterId)
    }
  )
}

// 他のファイルから使用される関数をエクスポート
export const ensureDefaultChapter = chapterService.ensureDefaultChapter
