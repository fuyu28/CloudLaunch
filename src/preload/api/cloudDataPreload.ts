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

import type { ApiResult } from "../../types/result"

/**
 * クラウドデータアイテムの型定義
 */
export interface CloudDataItem {
  /** ゲーム名/フォルダ名 */
  name: string
  /** 総ファイルサイズ（バイト） */
  totalSize: number
  /** ファイル数 */
  fileCount: number
  /** 最終更新日時 */
  lastModified: Date
  /** リモートパス（削除時に使用） */
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
export interface CloudFileDetail {
  /** ファイル名 */
  name: string
  /** ファイルサイズ（バイト） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** S3オブジェクトキー */
  key: string
  /** 相対パス */
  relativePath: string
}

/**
 * ディレクトリツリーノードの型定義
 */
export interface CloudDirectoryNode {
  /** ノード名 */
  name: string
  /** フルパス */
  path: string
  /** ディレクトリかどうか */
  isDirectory: boolean
  /** ファイルサイズ（ディレクトリの場合は配下の総サイズ） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** 子ノード */
  children?: CloudDirectoryNode[]
  /** S3オブジェクトキー（ファイルの場合） */
  objectKey?: string
}

export const cloudDataApi = {
  /**
   * クラウドデータ一覧を取得
   * @returns Promise<ApiResult<CloudDataItem[]>>
   */
  listCloudData: (): Promise<ApiResult<CloudDataItem[]>> => ipcRenderer.invoke("cloud-data-list"),

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
    ipcRenderer.invoke("cloud-data-get-directory-tree"),

  /**
   * クラウドファイルを個別削除
   * @param objectKey 削除対象のS3オブジェクトキー
   * @returns Promise<ApiResult>
   */
  deleteFile: (objectKey: string): Promise<ApiResult> =>
    ipcRenderer.invoke("cloud-data-delete-file", objectKey)
}
