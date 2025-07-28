/**
 * @fileoverview 章管理関連のプリロードAPI
 *
 * レンダラープロセスから章管理機能にアクセスするためのAPI定義です。
 * IPCを通してメインプロセスの章管理機能を呼び出します。
 */

import { ipcRenderer } from "electron"

import type {
  Chapter,
  ChapterStats,
  ChapterCreateInput,
  ChapterUpdateInput
} from "../../types/chapter"
import type { ApiResult } from "../../types/result"

export const chapterPreload = {
  /**
   * ゲームの章一覧を取得
   *
   * @param gameId - ゲームID
   * @returns 章一覧
   */
  getChapters: async (gameId: string): Promise<ApiResult<Chapter[]>> => {
    return await ipcRenderer.invoke("chapter:getChapters", gameId)
  },

  /**
   * 章を作成
   *
   * @param input - 章作成データ
   * @returns 作成された章
   */
  createChapter: async (input: ChapterCreateInput): Promise<ApiResult<Chapter>> => {
    return await ipcRenderer.invoke("chapter:createChapter", input)
  },

  /**
   * 章を更新
   *
   * @param chapterId - 章ID
   * @param input - 更新データ
   * @returns 更新された章
   */
  updateChapter: async (
    chapterId: string,
    input: ChapterUpdateInput
  ): Promise<ApiResult<Chapter>> => {
    return await ipcRenderer.invoke("chapter:updateChapter", chapterId, input)
  },

  /**
   * 章を削除
   *
   * @param chapterId - 章ID
   * @returns 削除結果
   */
  deleteChapter: async (chapterId: string): Promise<ApiResult<void>> => {
    return await ipcRenderer.invoke("chapter:deleteChapter", chapterId)
  },

  /**
   * 章の順序を更新（複数章の順序を一括更新）
   *
   * @param gameId - ゲームID
   * @param chapterOrders - 章IDと順序のペア配列
   * @returns 更新結果
   */
  updateChapterOrders: async (
    gameId: string,
    chapterOrders: Array<{ id: string; order: number }>
  ): Promise<ApiResult<void>> => {
    return await ipcRenderer.invoke("chapter:updateChapterOrders", gameId, chapterOrders)
  },

  /**
   * 章別統計データを取得
   *
   * @param gameId - ゲームID
   * @returns 章別統計データ
   */
  getChapterStats: async (gameId: string): Promise<ApiResult<ChapterStats[]>> => {
    return await ipcRenderer.invoke("chapter:getChapterStats", gameId)
  },

  /**
   * デフォルトの「デフォルト」を作成または取得
   *
   * @param gameId - ゲームID
   * @returns デフォルト章
   */
  ensureDefaultChapter: async (gameId: string): Promise<ApiResult<Chapter>> => {
    return await ipcRenderer.invoke("chapter:ensureDefaultChapter", gameId)
  },

  /**
   * ゲームの現在の章を変更
   *
   * @param gameId - ゲームID
   * @param chapterId - 新しい章ID
   * @returns 更新結果
   */
  setCurrentChapter: async (gameId: string, chapterId: string): Promise<ApiResult<void>> => {
    return await ipcRenderer.invoke("chapter:setCurrentChapter", gameId, chapterId)
  }
}
