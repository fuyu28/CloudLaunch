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

import type { ApiResult } from "../../types/result"
import {
  getAllObjectsWithMetadata,
  deleteObjectsByPrefix,
  deleteObjectByKey
} from "../service/cloudStorageService"
import {
  type CloudDataItem,
  type CloudFileDetail,
  type CloudDirectoryNode,
  groupObjectsByFolder,
  createCloudDataItems,
  buildDirectoryTree,
  createFileDetails
} from "../utils/cloudDataTransformer"
import { withValidatedCloudStorage } from "../utils/cloudStorageHelper"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { logger } from "../utils/logger"
import { validatePathSecurity } from "../utils/pathSecurity"

// 型定義はcloudDataTransformer.tsから再エクスポート
export type {
  CloudDataItem,
  CloudFileDetail,
  CloudDirectoryNode
} from "../utils/cloudDataTransformer"

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
        try {
          // バケット内の全オブジェクトを取得
          const allObjects = await getAllObjectsWithMetadata(s3Client, credentials.bucketName)

          // フォルダごとにグループ化してCloudDataItemに変換
          const folderMap = groupObjectsByFolder(allObjects)
          const cloudDataItems = createCloudDataItems(folderMap)

          return {
            success: true,
            data: cloudDataItems
          }
        } catch (error) {
          logger.error("クラウドデータ一覧取得エラー:", error)
          return {
            success: false,
            message: "クラウドデータの取得に失敗しました"
          }
        }
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
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, s3Client } = validationResult.data!

      try {
        // プレフィックス配下のオブジェクトを一括削除
        await deleteObjectsByPrefix(s3Client, credentials.bucketName, remotePath)

        return {
          success: true
        }
      } catch (error) {
        logger.error("クラウドデータ削除エラー:", error)

        // CloudStorageErrorの場合は適切なメッセージを返す
        if (error instanceof Error && error.name === "CloudStorageError") {
          return {
            success: false,
            message: error.message
          }
        }

        return {
          success: false,
          message: "クラウドデータの削除に失敗しました"
        }
      }
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
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, s3Client } = validationResult.data!

        try {
          // パストラバーサル攻撃対策
          try {
            validatePathSecurity(remotePath)
          } catch (error) {
            return {
              success: false,
              message: error instanceof Error ? error.message : "不正なパスが指定されました"
            }
          }

          // 指定フォルダ内のオブジェクト一覧取得
          const objects = await getAllObjectsWithMetadata(
            s3Client,
            credentials.bucketName,
            remotePath + "/"
          )

          // ファイル詳細情報に変換
          const fileDetails = createFileDetails(objects, remotePath)

          return {
            success: true,
            data: fileDetails
          }
        } catch (error) {
          logger.error("クラウドファイル詳細取得エラー:", error)
          return {
            success: false,
            message: "ファイル詳細の取得に失敗しました"
          }
        }
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
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, s3Client } = validationResult.data!

      try {
        // バケット内の全オブジェクトを取得
        const allObjects = await getAllObjectsWithMetadata(s3Client, credentials.bucketName)

        // ディレクトリツリーを構築
        const directoryTree = buildDirectoryTree(allObjects)

        return {
          success: true,
          data: directoryTree
        }
      } catch (error) {
        logger.error("クラウドディレクトリツリー取得エラー:", error)
        return {
          success: false,
          message: "ディレクトリツリーの取得に失敗しました"
        }
      }
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
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, s3Client } = validationResult.data!

      try {
        // 単一オブジェクトを削除
        await deleteObjectByKey(s3Client, credentials.bucketName, objectKey)

        return {
          success: true
        }
      } catch (error) {
        logger.error("クラウドファイル削除エラー:", error)

        // CloudStorageErrorの場合は適切なメッセージを返す
        if (error instanceof Error && error.name === "CloudStorageError") {
          return {
            success: false,
            message: error.message
          }
        }

        return {
          success: false,
          message: "ファイルの削除に失敗しました"
        }
      }
    })
  )
}
