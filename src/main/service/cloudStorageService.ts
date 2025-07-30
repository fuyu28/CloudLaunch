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

import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
  type S3Client
} from "@aws-sdk/client-s3"

import { CONFIG } from "../../constants/config"
import type { Creds } from "../../types/creds"
import { createS3ClientFromCredentials } from "../s3Client"
import { logger } from "../utils/logger"
import { validateObjectKeySecurity } from "../utils/pathSecurity"
import type { ReadStream } from "fs"

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
export type S3ObjectMetadata = {
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
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param prefix プレフィックス（オプション）
 * @returns オブジェクトメタデータの配列
 * @throws Error 無限ループ防止リミットに達した場合
 */
export async function getAllObjectsWithMetadata(
  s3Client: S3Client,
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

    const listResult = await s3Client.send(
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
 * 指定したプレフィックス配下のすべてのオブジェクトを削除
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param prefix 削除対象のプレフィックス
 * @returns 削除されたオブジェクト数
 * @throws Error パス検証に失敗した場合、削除に失敗した場合
 */
export async function deleteObjectsByPrefix(
  s3Client: S3Client,
  bucketName: string,
  prefix: string
): Promise<number> {
  // パス検証
  validateObjectKeySecurity(prefix)

  // 削除対象オブジェクトの一覧取得
  const objectsToDelete = await getAllObjectsWithMetadata(
    s3Client,
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

    deletePromises.push(s3Client.send(deleteCommand))
  }

  // 全てのバッチを並列実行
  await Promise.all(deletePromises)

  logger.info(`クラウドデータ削除完了: ${prefix} (${objectsToDelete.length}件)`)
  return objectsToDelete.length
}

/**
 * 指定したオブジェクトキーのファイルを削除
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey 削除対象のオブジェクトキー
 * @throws Error パス検証に失敗した場合、削除に失敗した場合
 */
export async function deleteObjectByKey(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<void> {
  // パス検証
  validateObjectKeySecurity(objectKey)

  // 単一ファイルを削除
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: [{ Key: objectKey }],
      Quiet: true
    }
  })

  await s3Client.send(deleteCommand)
  logger.info(`クラウドファイル削除完了: ${objectKey}`)
}

/**
 * オブジェクトをクラウドストレージにアップロード
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey アップロード先のオブジェクトキー
 * @param data アップロードするデータ
 * @param contentType コンテンツタイプ（オプション）
 * @throws Error パス検証に失敗した場合、アップロードに失敗した場合
 */
export async function uploadObject(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  data: Buffer | string | ReadStream,
  contentType?: string
): Promise<void> {
  // パス検証
  validateObjectKeySecurity(objectKey)

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: data,
    ContentType: contentType || "application/octet-stream"
  })

  await s3Client.send(putCommand)
  logger.info(`クラウドファイルアップロード完了: ${objectKey}`)
}

/**
 * オブジェクトをクラウドストレージからダウンロード
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey ダウンロードするオブジェクトキー
 * @returns ダウンロードしたデータ
 * @throws Error パス検証に失敗した場合、ダウンロードに失敗した場合
 */
export async function downloadObject(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<string> {
  // パス検証
  validateObjectKeySecurity(objectKey)

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey
  })

  const response = await s3Client.send(getCommand)
  if (!response.Body) {
    throw new CloudStorageError(`オブジェクトが見つかりません: ${objectKey}`, "downloadObject")
  }

  const data = await response.Body.transformToString()
  logger.info(`クラウドファイルダウンロード完了: ${objectKey}`)
  return data
}

/**
 * オブジェクトが存在するかチェック
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey チェックするオブジェクトキー
 * @returns オブジェクトが存在する場合true
 */
export async function objectExists(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<boolean> {
  try {
    // パス検証
    validateObjectKeySecurity(objectKey)

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    })

    await s3Client.send(getCommand)
    return true
  } catch {
    // オブジェクトが存在しない場合はfalseを返す
    return false
  }
}

/**
 * オブジェクトをクラウドストレージからストリームとしてダウンロード
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param objectKey ダウンロードするオブジェクトキー
 * @returns ダウンロードストリーム
 * @throws Error パス検証に失敗した場合、ダウンロードに失敗した場合
 */
export async function downloadObjectStream(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<NodeJS.ReadableStream> {
  // パス検証
  validateObjectKeySecurity(objectKey)

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey
  })

  const response = await s3Client.send(getCommand)
  if (!response.Body) {
    throw new CloudStorageError(
      `オブジェクトが見つかりません: ${objectKey}`,
      "downloadObjectStream"
    )
  }

  logger.info(`クラウドファイルストリームダウンロード開始: ${objectKey}`)
  return response.Body as NodeJS.ReadableStream
}

/**
 * 指定したプレフィックス配下のフォルダ一覧を取得
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param prefix プレフィックス（オプション）
 * @returns フォルダ名の配列
 * @throws Error 取得に失敗した場合
 */
export async function listFolders(
  s3Client: S3Client,
  bucketName: string,
  prefix: string = ""
): Promise<string[]> {
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    Delimiter: "/"
  })

  const response = await s3Client.send(listCommand)
  const folders: string[] = []

  if (response.CommonPrefixes) {
    for (const commonPrefix of response.CommonPrefixes) {
      if (commonPrefix.Prefix) {
        // プレフィックスから最後の "/" を除去してフォルダ名として使用
        const folderName = commonPrefix.Prefix.replace(/\/$/, "").split("/").pop()
        if (folderName) {
          folders.push(folderName)
        }
      }
    }
  }

  logger.info(`フォルダ一覧を取得しました: ${folders.length}件`)
  return folders
}

/**
 * クラウドストレージへの接続テストを実行
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @throws Error 接続に失敗した場合
 */
export async function testConnection(s3Client: S3Client, bucketName: string): Promise<void> {
  const testCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Delimiter: "/",
    MaxKeys: 1
  })

  await s3Client.send(testCommand)
  logger.info(`接続テスト成功: ${bucketName}`)
}

/**
 * 認証情報を使用してクラウドストレージへの接続テストを実行
 *
 * @param credentials テスト対象の認証情報
 * @throws Error 接続に失敗した場合
 */
export async function testConnectionWithCredentials(credentials: Creds): Promise<void> {
  // 統一されたS3Client作成関数を使用
  const s3Client = createS3ClientFromCredentials(credentials)
  await testConnection(s3Client, credentials.bucketName)
}
