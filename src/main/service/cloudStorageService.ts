/**
 * @fileoverview クラウドストレージサービス
 *
 * このサービスは、R2/S3クラウドストレージとの低レベルな操作を提供します。
 *
 * 主な機能：
 * - オブジェクト一覧の取得（ページネーション対応）
 * - オブジェクトの削除（一括・個別）
 * - セキュリティ機能（パス検証、リミット制御）
 */

import { ListObjectsV2Command, DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3"
import { CONFIG } from "../../constants/config"
import { logger } from "../utils/logger"

/**
 * クラウドストレージサービス専用エラークラス
 */
export class CloudStorageError extends Error {
  constructor(
    message: string,
    public readonly operation: string
  ) {
    super(message)
    this.name = "CloudStorageError"
  }
}

/**
 * S3オブジェクトのメタデータ型定義
 */
export interface S3ObjectMetadata {
  /** オブジェクトキー */
  key: string
  /** ファイルサイズ（バイト） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
}

/**
 * リモートパス配下のすべてのオブジェクトキーとメタデータを取得
 *
 * @param r2Client S3クライアント
 * @param bucketName バケット名
 * @param prefix プレフィックス（オプション）
 * @returns オブジェクトメタデータの配列
 * @throws Error 無限ループ防止リミットに達した場合
 */
export async function getAllObjectsWithMetadata(
  r2Client: S3Client,
  bucketName: string,
  prefix: string = ""
): Promise<S3ObjectMetadata[]> {
  const allObjects: S3ObjectMetadata[] = []
  let token: string | undefined = undefined
  let iterationCount = 0

  do {
    iterationCount++
    if (iterationCount > CONFIG.AWS.MAX_LIST_ITERATIONS) {
      throw new Error(
        `オブジェクト一覧取得でリミットに達しました（${CONFIG.AWS.MAX_LIST_ITERATIONS}回の反復）`
      )
    }

    const listResult = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: token
      })
    )

    listResult.Contents?.forEach((obj) => {
      if (obj.Key && obj.LastModified && obj.Size !== undefined) {
        allObjects.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        })
      }
    })

    token = listResult.NextContinuationToken
  } while (token)

  return allObjects
}

/**
 * パストラバーサル攻撃対策のためのパス検証
 *
 * @param path 検証対象のパス
 * @throws CloudStorageError 不正なパスの場合
 */
export function validatePath(path: string): void {
  if (path.includes("..") || path.startsWith("/")) {
    throw new CloudStorageError("不正なパスが指定されました", "validatePath")
  }
}

/**
 * 指定したプレフィックス配下のすべてのオブジェクトを削除
 *
 * @param r2Client S3クライアント
 * @param bucketName バケット名
 * @param prefix 削除対象のプレフィックス
 * @returns 削除されたオブジェクト数
 * @throws Error パス検証に失敗した場合、削除に失敗した場合
 */
export async function deleteObjectsByPrefix(
  r2Client: S3Client,
  bucketName: string,
  prefix: string
): Promise<number> {
  // パス検証
  validatePath(prefix)

  // 削除対象オブジェクトの一覧取得
  const objectsToDelete = await getAllObjectsWithMetadata(
    r2Client,
    bucketName,
    prefix.endsWith("/") ? prefix : prefix + "/"
  )

  if (objectsToDelete.length === 0) {
    logger.warn(`削除対象のデータが見つかりません: ${prefix}`)
    return 0
  }

  // バッチ単位で削除実行
  const deletePromises: Promise<unknown>[] = []

  for (let i = 0; i < objectsToDelete.length; i += CONFIG.AWS.DELETE_BATCH_SIZE) {
    const batch = objectsToDelete.slice(i, i + CONFIG.AWS.DELETE_BATCH_SIZE)

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: batch.map((obj) => ({ Key: obj.key })),
        Quiet: true // エラー以外の詳細な結果は返さない
      }
    })

    deletePromises.push(r2Client.send(deleteCommand))
  }

  // 全てのバッチを並列実行
  await Promise.all(deletePromises)

  logger.info(`クラウドデータ削除完了: ${prefix} (${objectsToDelete.length}件)`)
  return objectsToDelete.length
}

/**
 * 指定したオブジェクトキーのファイルを削除
 *
 * @param r2Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey 削除対象のオブジェクトキー
 * @throws Error パス検証に失敗した場合、削除に失敗した場合
 */
export async function deleteObjectByKey(
  r2Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<void> {
  // パス検証
  validatePath(objectKey)

  // 単一ファイルを削除
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: [{ Key: objectKey }],
      Quiet: true
    }
  })

  await r2Client.send(deleteCommand)
  logger.info(`クラウドファイル削除完了: ${objectKey}`)
}
