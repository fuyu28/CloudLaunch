/**
 * @fileoverview メモ管理機能のpreload API定義
 *
 * このファイルは、レンダラープロセスからメインプロセスへのメモ関連
 * IPC通信を安全に実行するためのAPI関数を定義します。
 * すべてのメモ操作（CRUD）をサポートしています。
 */

import { ipcRenderer } from "electron"
import type { ApiResult } from "../../types/result"
import type { MemoType, CreateMemoData, UpdateMemoData } from "../../types/memo"

export const memoApi = {
  /**
   * 指定されたゲームのメモ一覧を取得します
   * @param gameId ゲームID
   * @returns メモ一覧
   */
  getMemosByGameId: async (gameId: string): Promise<ApiResult<MemoType[]>> => {
    return await ipcRenderer.invoke("memo:getMemosByGameId", gameId)
  },

  /**
   * 指定されたIDのメモを取得します
   * @param memoId メモID
   * @returns メモデータ
   */
  getMemoById: async (memoId: string): Promise<ApiResult<MemoType | null>> => {
    return await ipcRenderer.invoke("memo:getMemoById", memoId)
  },

  /**
   * 新しいメモを作成します
   * @param memoData メモ作成データ
   * @returns 作成されたメモ
   */
  createMemo: async (memoData: CreateMemoData): Promise<ApiResult<MemoType>> => {
    return await ipcRenderer.invoke("memo:createMemo", memoData)
  },

  /**
   * メモを更新します
   * @param memoId メモID
   * @param updateData 更新データ
   * @returns 更新されたメモ
   */
  updateMemo: async (memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>> => {
    return await ipcRenderer.invoke("memo:updateMemo", memoId, updateData)
  },

  /**
   * メモを削除します
   * @param memoId メモID
   * @returns 削除結果
   */
  deleteMemo: async (memoId: string): Promise<ApiResult<boolean>> => {
    return await ipcRenderer.invoke("memo:deleteMemo", memoId)
  },

  /**
   * メモファイルのパスを取得します
   * @param memoId メモID
   * @returns ファイルパス
   */
  getMemoFilePath: async (memoId: string): Promise<ApiResult<string>> => {
    return await ipcRenderer.invoke("memo:getMemoFilePath", memoId)
  },

  /**
   * ゲームのメモディレクトリパスを取得します
   * @param gameId ゲームID
   * @returns ディレクトリパス
   */
  getGameMemoDir: async (gameId: string): Promise<ApiResult<string>> => {
    return await ipcRenderer.invoke("memo:getGameMemoDir", gameId)
  },

  /**
   * すべてのメモ一覧を取得します
   * @returns メモ一覧
   */
  getAllMemos: async (): Promise<ApiResult<MemoType[]>> => {
    return await ipcRenderer.invoke("memo:getAllMemos")
  },

  /**
   * メモルートディレクトリパスを取得します
   * @returns ディレクトリパス
   */
  getMemoRootDir: async (): Promise<ApiResult<string>> => {
    return await ipcRenderer.invoke("memo:getMemoRootDir")
  }
}
