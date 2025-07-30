/**
 * @fileoverview クラウドデータ操作のPreload API
 *
 * このファイルは、レンダラープロセスからクラウドデータの閲覧・管理機能へ
 * 安全にアクセスするためのPreload APIを定義します。
 *
 * 提供する機能：
 * - クラウドデータ一覧取得
 * - クラウドデータ削除
 * - クラウドファイル詳細取得
 *
 * セキュリティ：
 * - contextIsolationにより安全なIPC通信を実現
 * - 型安全なAPIインターフェース
 */

import { ipcRenderer } from "electron"

import type { CloudDataItem, CloudFileDetail, CloudDirectoryNode } from "../../types/cloud"
import type { ApiResult } from "../../types/result"

export const cloudDataApi = {
  /**
   * クラウドデータ一覧を取得
   * @returns Promise<ApiResult<CloudDataItem[]>>
   */
  listCloudData: (): Promise<ApiResult<CloudDataItem[]>> => ipcRenderer.invoke("cloud:listData"),

  /**
   * クラウドデータを削除
   * @param remotePath 削除対象のリモートパス
   * @returns Promise<ApiResult>
   */
  deleteCloudData: (remotePath: string): Promise<ApiResult> =>
    ipcRenderer.invoke("cloud-data-delete", remotePath),

  /**
   * クラウドファイル詳細を取得
   * @param remotePath 対象のリモートパス
   * @returns Promise<ApiResult<CloudFileDetail[]>>
   */
  getCloudFileDetails: (remotePath: string): Promise<ApiResult<CloudFileDetail[]>> =>
    ipcRenderer.invoke("cloud-data-get-folder-files", remotePath),

  /**
   * クラウドディレクトリツリーを取得
   * @returns Promise<ApiResult<CloudDirectoryNode[]>>
   */
  getDirectoryTree: (): Promise<ApiResult<CloudDirectoryNode[]>> =>
    ipcRenderer.invoke("cloud:getDirectoryTree"),

  /**
   * クラウドファイルを個別削除
   * @param objectKey 削除対象のS3オブジェクトキー
   * @returns Promise<ApiResult>
   */
  deleteFile: (objectKey: string): Promise<ApiResult> =>
    ipcRenderer.invoke("cloud-data-delete-file", objectKey)
}
