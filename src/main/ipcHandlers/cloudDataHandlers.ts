/**
 * @fileoverview クラウドデータ管理IPCハンドラー
 *
 * このファイルは、フロントエンドからのIPC通信を受け取り、
 * クラウドストレージサービスを呼び出してデータ管理を行います。
 *
 * 提供するAPI：
 * - cloud-data-list: クラウド上の全ゲームデータ一覧取得
 * - cloud-data-delete: 指定したゲームデータの削除
 * - cloud-data-get-folder-files: ファイル詳細情報の取得
 * - cloud-data-get-directory-tree: ディレクトリツリー取得
 * - cloud-data-delete-file: 個別ファイル削除
 *
 * アーキテクチャ：
 * - ビジネスロジックはcloudStorageService.tsに分離
 * - データ変換処理はcloudDataTransformer.tsに分離
 * - エラーハンドリングは統一されたパターンを採用
 * - セキュリティ検証は各サービス層で実行
 */

import { ipcMain } from "electron"

import type { CloudDataItem, CloudFileDetail, CloudDirectoryNode } from "../../types/cloud"
import type { ApiResult } from "../../types/result"
import {
  getAllObjectsWithMetadata,
  deleteObjectsByPrefix,
  deleteObjectByKey
} from "../service/cloudStorageService"
import {
  groupObjectsByFolder,
  createCloudDataItems,
  buildDirectoryTree,
  createFileDetails
} from "../utils/cloudDataTransformer"
import { withValidatedCloudStorage } from "../utils/cloudStorageHelper"
import { withErrorHandling } from "../utils/commonErrorHandlers"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { validatePathSecurity } from "../utils/pathSecurity"

// 型定義は共通のcloud.d.tsから再エクスポート
export type { CloudDataItem, CloudFileDetail, CloudDirectoryNode } from "../../types/cloud"

// 関数は別ファイルに分離済み（cloudStorageService.ts、cloudDataTransformer.ts）

export function registerCloudDataHandlers(): void {
  /**
   * クラウドデータ一覧取得API
   *
   * R2/S3クラウドストレージ上の全ゲームデータをエクスプローラー形式で取得します。
   *
   * @returns ApiResult<CloudDataItem[]> クラウドデータ一覧
   */
  ipcMain.handle(
    "cloud-data-list",
    withFileOperationErrorHandling(async (): Promise<ApiResult<CloudDataItem[]>> => {
      return withValidatedCloudStorage(async (credentials, s3Client) => {
        return withErrorHandling(async () => {
          // バケット内の全オブジェクトを取得
          const allObjects = await getAllObjectsWithMetadata(s3Client, credentials.bucketName)

          // フォルダごとにグループ化してCloudDataItemに変換
          const folderMap = groupObjectsByFolder(allObjects)
          const cloudDataItems = createCloudDataItems(folderMap)

          return cloudDataItems
        }, "クラウドデータ一覧取得")
      })
    })
  )

  /**
   * クラウドデータ削除API
   *
   * 指定したゲーム/フォルダのクラウドデータを完全削除します。
   *
   * @param remotePath 削除対象のリモートパス
   * @returns ApiResult 削除結果
   */
  ipcMain.handle(
    "cloud-data-delete",
    withFileOperationErrorHandling(async (_event, remotePath: string): Promise<ApiResult> => {
      return withValidatedCloudStorage(async (credentials, s3Client) => {
        return withErrorHandling(async () => {
          // プレフィックス配下のオブジェクトを一括削除
          await deleteObjectsByPrefix(s3Client, credentials.bucketName, remotePath)
        }, "クラウドデータ削除")
      })
    })
  )

  /**
   * クラウドファイル詳細取得API
   *
   * 指定したフォルダ内の全ファイルの詳細情報を取得します。
   *
   * @param remotePath 対象のリモートパス
   * @returns ApiResult<CloudFileDetail[]> ファイル詳細一覧
   */
  ipcMain.handle(
    "cloud-data-get-folder-files",
    withFileOperationErrorHandling(
      async (_event, remotePath: string): Promise<ApiResult<CloudFileDetail[]>> => {
        return withValidatedCloudStorage(async (credentials, s3Client) => {
          return withErrorHandling(async () => {
            // パストラバーサル攻撃対策
            validatePathSecurity(remotePath)

            // 指定フォルダ内のオブジェクト一覧取得
            const objects = await getAllObjectsWithMetadata(
              s3Client,
              credentials.bucketName,
              remotePath + "/"
            )

            // ファイル詳細情報に変換
            const fileDetails = createFileDetails(objects, remotePath)

            return fileDetails
          }, "クラウドファイル詳細取得")
        })
      }
    )
  )

  /**
   * クラウドディレクトリツリー取得API
   *
   * R2/S3クラウドストレージの階層構造をツリー形式で取得します。
   *
   * @returns ApiResult<CloudDirectoryNode[]> ディレクトリツリー
   */
  ipcMain.handle(
    "cloud-data-get-directory-tree",
    withFileOperationErrorHandling(async (): Promise<ApiResult<CloudDirectoryNode[]>> => {
      return withValidatedCloudStorage(async (credentials, s3Client) => {
        return withErrorHandling(async () => {
          // バケット内の全オブジェクトを取得
          const allObjects = await getAllObjectsWithMetadata(s3Client, credentials.bucketName)

          // ディレクトリツリーを構築
          const directoryTree = buildDirectoryTree(allObjects)

          return directoryTree
        }, "クラウドディレクトリツリー取得")
      })
    })
  )

  /**
   * クラウドファイル個別削除API
   *
   * 指定したファイルのクラウドデータを削除します。
   *
   * @param objectKey 削除対象のS3オブジェクトキー
   * @returns ApiResult 削除結果
   */
  ipcMain.handle(
    "cloud-data-delete-file",
    withFileOperationErrorHandling(async (_event, objectKey: string): Promise<ApiResult> => {
      return withValidatedCloudStorage(async (credentials, s3Client) => {
        return withErrorHandling(async () => {
          // 単一オブジェクトを削除
          await deleteObjectByKey(s3Client, credentials.bucketName, objectKey)
        }, "クラウドファイル削除")
      })
    })
  )
}
