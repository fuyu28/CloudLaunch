/**
 * @fileoverview セーブデータダウンロードサービス
 *
 * このサービスは、クラウドストレージからセーブデータをダウンロードする
 * ビジネスロジックを提供します。
 *
 * 主な機能：
 * - セーブデータ一括ダウンロード
 * - クラウドデータ情報取得
 * - ファイル詳細情報取得
 * - バッチ処理による効率的なダウンロード
 */

import { createWriteStream } from "fs"
import { mkdir } from "fs/promises"
import { dirname, join, relative } from "path"

import { HeadObjectCommand, type S3Client } from "@aws-sdk/client-s3"

import type { ApiResult } from "../../types/result"
import { createRemotePath } from "../../utils/stringUtils"
import { BATCH_SIZES } from "../constants/processing"
import { prisma } from "../db"
import { getAllObjectsWithMetadata, downloadObjectStream } from "./cloudStorageService"
import { withErrorHandling } from "../utils/commonErrorHandlers"
import { logger } from "../utils/logger"

export type CloudDataInfo = {
  exists: boolean
  uploadedAt?: Date
  size?: number
  comment?: string
}

export type CloudFileDetail = {
  name: string
  size: number
  lastModified: Date
  key: string
}

export type CloudFileDetails = {
  exists: boolean
  totalSize: number
  files: CloudFileDetail[]
}

/**
 * セーブデータを一括ダウンロードします
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param localPath ダウンロード先のローカルディレクトリパス
 * @param remotePath ダウンロード元のリモートパス
 * @returns Promise<ApiResult> ダウンロード結果
 */
export async function downloadSaveData(
  s3Client: S3Client,
  bucketName: string,
  localPath: string,
  remotePath: string
): Promise<ApiResult<boolean>> {
  return withErrorHandling(async () => {
    // リモートオブジェクトの一覧取得
    const allObjects = await getAllObjectsWithMetadata(s3Client, bucketName, remotePath)

    // バッチ処理でダウンロード
    const batchSize = BATCH_SIZES.UPLOAD_DOWNLOAD
    const validDownloads: Array<{ key: string; outputPath: string }> = []

    // まず有効なダウンロード対象をフィルタリング
    for (const obj of allObjects) {
      const relativePath = relative(remotePath, obj.key)

      // パストラバーサル攻撃対策
      if (relativePath.startsWith("../") || relativePath.includes("/../")) {
        logger.warn(`パストラバーサル攻撃の可能性があるパスをスキップ: ${obj.key}`)
        continue
      }

      const outputPath = join(localPath, relativePath)

      // 出力パスがlocalPath内にあることを確認
      if (!outputPath.startsWith(localPath)) {
        logger.warn(`不正な出力パスをスキップ: ${outputPath}`)
        continue
      }

      validDownloads.push({ key: obj.key, outputPath })
    }

    // バッチ処理でダウンロード
    for (let i = 0; i < validDownloads.length; i += batchSize) {
      const batch = validDownloads.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async ({ key, outputPath }) => {
          // ディレクトリの作成
          await mkdir(dirname(outputPath), { recursive: true })

          // ファイルのダウンロード
          const bodyStream = await downloadObjectStream(s3Client, bucketName, key)
          const writeStream = createWriteStream(outputPath)

          await new Promise<void>((resolve, reject) => {
            bodyStream.pipe(writeStream).on("finish", resolve).on("error", reject)
          })
          logger.debug(`ダウンロード完了: ${relative(localPath, outputPath)}`)
        })
      )
      logger.info(
        `ダウンロード進捗: ${Math.min(i + batchSize, validDownloads.length)}/${validDownloads.length}`
      )
    }

    return true
  }, "セーブデータダウンロード")
}

/**
 * クラウドデータ情報を取得します
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param gameId ゲームID
 * @returns Promise<ApiResult<CloudDataInfo>> クラウドデータ情報
 */
export async function getCloudDataInfo(
  s3Client: S3Client,
  bucketName: string,
  gameId: string
): Promise<ApiResult<CloudDataInfo>> {
  return withErrorHandling(async () => {
    // ゲーム情報を取得
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      throw new Error(`ゲーム ID ${gameId} が見つかりません`)
    }

    // ゲームタイトルからリモートパスを生成
    const remotePath = createRemotePath(game.title)

    try {
      // リモートパス配下のオブジェクトを検索
      const objects = await getAllObjectsWithMetadata(s3Client, bucketName, remotePath)

      if (objects.length === 0) {
        return { exists: false }
      }

      // 最終更新日時で降順にソートして最新のオブジェクトを取得
      objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      const latestObject = objects[0]

      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: latestObject.key
      })

      const headResult = await s3Client.send(headCommand)

      // 最新ファイルのサイズを使用（後方互換性のため）
      const totalSize = headResult.ContentLength || 0

      return {
        exists: true,
        uploadedAt: headResult.LastModified,
        size: totalSize,
        comment: headResult.Metadata?.comment || ""
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        return { exists: false }
      }
      throw error
    }
  }, "クラウドデータ情報取得")
}

/**
 * クラウドファイル詳細情報を取得します
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param gameId ゲームID
 * @returns Promise<ApiResult<CloudFileDetails>> ファイル詳細情報
 */
export async function getCloudFileDetails(
  s3Client: S3Client,
  bucketName: string,
  gameId: string
): Promise<ApiResult<CloudFileDetails>> {
  return withErrorHandling(async () => {
    // ゲーム情報を取得
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      throw new Error(`ゲーム ID ${gameId} が見つかりません`)
    }

    // ゲームタイトルからリモートパスを生成
    const remotePath = createRemotePath(game.title)

    try {
      // リモートパス配下のオブジェクトを検索
      const objects = await getAllObjectsWithMetadata(s3Client, bucketName, remotePath)

      if (objects.length === 0) {
        return {
          exists: false,
          totalSize: 0,
          files: []
        }
      }

      // 各ファイルの詳細情報を取得（バッチ処理で効率化）
      const batchSize = BATCH_SIZES.FILE_DETAILS
      const fileDetails: CloudFileDetail[] = []

      for (let i = 0; i < objects.length; i += batchSize) {
        const batch = objects.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (obj) => {
            try {
              const headCommand = new HeadObjectCommand({
                Bucket: bucketName,
                Key: obj.key
              })

              const headResult = await s3Client.send(headCommand)

              // ファイル名を取得（パスの最後の部分）
              const fileName = obj.key.split("/").pop() || obj.key

              return {
                name: fileName,
                size: headResult.ContentLength || 0,
                lastModified: headResult.LastModified || obj.lastModified,
                key: obj.key
              }
            } catch (error) {
              logger.warn(`ファイル詳細情報の取得に失敗: ${obj.key}`, error)
              // フォールバック: getAllObjectsWithMetadataの情報を使用
              const fileName = obj.key.split("/").pop() || obj.key
              return {
                name: fileName,
                size: obj.size,
                lastModified: obj.lastModified,
                key: obj.key
              }
            }
          })
        )
        fileDetails.push(...batchResults)
      }

      // 総ファイルサイズを計算
      const totalSize = fileDetails.reduce((sum, file) => sum + file.size, 0)

      return {
        exists: true,
        totalSize,
        files: fileDetails
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        return {
          exists: false,
          totalSize: 0,
          files: []
        }
      }
      throw error
    }
  }, "クラウドファイル詳細取得")
}
