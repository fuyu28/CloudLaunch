/**
 * @fileoverview セーブデータのクラウドダウンロード機能
 *
 * このハンドラーは、R2/S3クラウドストレージからローカルへのセーブデータ
 * 一括ダウンロード機能を提供します。
 *
 * 主な処理フロー：
 * 1. 認証情報の検証とR2クライアントの作成
 * 2. リモートパス配下のすべてのオブジェクトをリスト取得
 * 3. パストラバーサル攻撃対策による安全性検証
 * 4. 各オブジェクトを並列バッチ処理でダウンロード
 * 5. ローカルディレクトリ構造の再構築
 *
 * 技術的特徴：
 * - ページネーション対応のオブジェクト一覧取得
 * - 5件ずつの並列バッチ処理によるダウンロード効率化
 * - パストラバーサル攻撃対策（../パスの検証）
 * - 相対パス構造の保持（リモートの階層構造をローカルでも維持）
 * - 自動ディレクトリ作成（mkdir -p 相当）
 * - 進捗表示とエラー時のフォールバック処理
 *
 * エラーハンドリング：
 * - AWS SDK固有エラーの詳細分析
 * - ネットワーク・権限・ファイルシステムエラーの適切な処理
 */

import { promises as fs } from "fs"
import { join, dirname, relative } from "path"

import { HeadObjectCommand } from "@aws-sdk/client-s3"
import { ipcMain } from "electron"

import type { ApiResult } from "../../types/result"
import { createRemotePath } from "../../utils/stringUtils"
import { getAllObjectsWithMetadata, downloadObjectStream } from "../service/cloudStorageService"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { logger } from "../utils/logger"
import type { S3Client } from "@aws-sdk/client-s3"

/**
 * リモートパス配下のすべてのオブジェクト情報を取得する関数（汎用サービスを使用）
 *
 * @param s3Client S3 クライアント
 * @param bucketName バケット名
 * @param remotePath リモートパス（プレフィックス）
 * @returns Promise<Array<{key: string; lastModified: Date}>> オブジェクト情報の配列
 */
async function getAllObjectKeys(
  s3Client: S3Client,
  bucketName: string,
  remotePath: string
): Promise<{ key: string; lastModified: Date }[]> {
  const prefix = remotePath.replace(/\/+$/, "") + "/"
  const objects = await getAllObjectsWithMetadata(s3Client, bucketName, prefix)

  return objects.map((obj) => ({
    key: obj.key,
    lastModified: obj.lastModified
  }))
}

/**
 * 単一ファイルをダウンロードする関数（汎用サービスを使用）
 *
 * ストリーミング処理により、メモリ効率的にファイルをダウンロードします。
 *
 * @param s3Client S3 クライアント
 * @param bucketName バケット名
 * @param key オブジェクトキー
 * @param outputPath 出力ファイルパス
 * @returns Promise<void>
 */
async function downloadFile(
  s3Client: S3Client,
  bucketName: string,
  key: string,
  outputPath: string
): Promise<void> {
  const bodyStream = await downloadObjectStream(s3Client, bucketName, key)
  const fileHandle = await fs.open(outputPath, "w")

  await new Promise<void>((resolve, reject) => {
    const writeStream = fileHandle.createWriteStream()
    bodyStream.pipe(writeStream).on("finish", resolve).on("error", reject)
  }).finally(() => fileHandle.close())
}

export function registerDownloadSaveDataHandler(): void {
  /**
   * セーブデータ一括ダウンロードAPI
   *
   * 指定されたリモートパス配下のすべてのファイルをローカルパスにダウンロードします。
   *
   * 処理詳細：
   * 1. 認証情報の検証（credentialServiceを使用）
   * 2. ListObjectsV2でリモートパス配下の全オブジェクトを取得（ページネーション対応）
   * 3. 各オブジェクトをGetObjectCommandでダウンロード
   * 4. 相対パス構造を維持してローカルに保存
   * 5. 必要に応じてディレクトリを自動作成
   *
   * 技術的詳細：
   * - ストリーミング処理によりメモリ使用量を最小化
   * - Promise-based非同期処理で効率的なファイル書き込み
   * - パス操作にNode.js標準のpath moduleを使用
   *
   * @param localPath ダウンロード先のローカルディレクトリパス（絶対パス推奨）
   * @param remotePath ダウンロード元のリモートパス（S3オブジェクトキープレフィックス）
   * @returns ApiResult ダウンロード結果（成功時はsuccess: true、失敗時は詳細なエラーメッセージ）
   */
  ipcMain.handle(
    "download-save-data",
    withFileOperationErrorHandling(
      async (_event, localPath: string, remotePath: string): Promise<ApiResult> => {
        // 認証情報の検証と R2 クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, s3Client } = validationResult.data!

        // リモートオブジェクトの一覧取得
        const allObjects = await getAllObjectKeys(s3Client, credentials.bucketName, remotePath)
        const allKeys = allObjects.map((obj) => obj.key)

        // 各ファイルのダウンロード（並列処理で効率化）
        const batchSize = 5 // 同時ダウンロード数を制限（ネットワーク負荷を考慮）
        const validDownloads: Array<{ key: string; outputPath: string }> = []

        // まず有効なダウンロード対象をフィルタリング
        for (const key of allKeys) {
          const relativePath = relative(remotePath, key)

          // パストラバーサル攻撃対策: 相対パスが上位ディレクトリを参照していないかチェック
          if (relativePath.startsWith("../") || relativePath.includes("/../")) {
            logger.warn(`パストラバーサル攻撃の可能性があるパスをスキップ: ${key}`)
            continue
          }

          const outputPath = join(localPath, relativePath)

          // 出力パスがlocalPath内にあることを確認
          if (!outputPath.startsWith(localPath)) {
            logger.warn(`不正な出力パスをスキップ: ${outputPath}`)
            continue
          }

          validDownloads.push({ key, outputPath })
        }

        // バッチ処理でダウンロード
        for (let i = 0; i < validDownloads.length; i += batchSize) {
          const batch = validDownloads.slice(i, i + batchSize)
          await Promise.all(
            batch.map(async ({ key, outputPath }) => {
              try {
                // ディレクトリの作成
                await fs.mkdir(dirname(outputPath), { recursive: true })

                // ファイルのダウンロード
                await downloadFile(s3Client, credentials.bucketName, key, outputPath)
                logger.debug(`ダウンロード完了: ${relative(localPath, outputPath)}`)
              } catch (error) {
                logger.error(`ファイルダウンロードに失敗: ${key}`, error)
                throw error
              }
            })
          )
          logger.info(
            `ダウンロード進捗: ${Math.min(i + batchSize, validDownloads.length)}/${validDownloads.length}`
          )
        }

        return { success: true }
      }
    )
  )

  // クラウドデータ情報取得ハンドラー
  ipcMain.handle(
    "get-cloud-data-info",
    withFileOperationErrorHandling(
      async (
        _event,
        gameId: string
      ): Promise<
        ApiResult<{ exists: boolean; uploadedAt?: Date; size?: number; comment?: string }>
      > => {
        const credentialResult = await validateCredentialsForR2()
        if (!credentialResult.success) {
          return { success: false, message: credentialResult.message }
        }

        const { credentials, s3Client } = credentialResult.data!
        const bucketName = credentials.bucketName

        // データベースからゲーム情報を取得してタイトルを取得
        const { prisma } = await import("../db")
        const game = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!game) {
          return { success: false, message: "ゲームが見つかりません" }
        }

        // ゲームタイトルからリモートパスを生成（アップロード処理と同じ形式）
        const remotePath = createRemotePath(game.title)

        try {
          // リモートパス配下のオブジェクトを検索
          const objects = await getAllObjectKeys(s3Client, bucketName, remotePath)

          if (objects.length === 0) {
            return { success: true, data: { exists: false } }
          }

          // 最終更新日時で降順にソートして最新のオブジェクトを取得
          objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
          const latestObjectKey = objects[0].key

          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: latestObjectKey
          })

          const headResult = await s3Client.send(headCommand)

          // 最新ファイルのサイズを使用（後方互換性のため）
          const totalSize = headResult.ContentLength || 0

          return {
            success: true,
            data: {
              exists: true,
              uploadedAt: headResult.LastModified,
              size: totalSize,
              comment: headResult.Metadata?.comment || ""
            }
          }
        } catch (error) {
          if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
            return { success: true, data: { exists: false } }
          }
          throw error
        }
      }
    )
  )

  // クラウドファイル詳細情報取得ハンドラー
  ipcMain.handle(
    "get-cloud-file-details",
    withFileOperationErrorHandling(
      async (
        _event,
        gameId: string
      ): Promise<
        ApiResult<{
          exists: boolean
          totalSize: number
          files: Array<{
            name: string
            size: number
            lastModified: Date
            key: string
          }>
        }>
      > => {
        const credentialResult = await validateCredentialsForR2()
        if (!credentialResult.success) {
          return { success: false, message: credentialResult.message }
        }

        const { credentials, s3Client } = credentialResult.data!
        const bucketName = credentials.bucketName

        // データベースからゲーム情報を取得してタイトルを取得
        const { prisma } = await import("../db")
        const game = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!game) {
          return { success: false, message: "ゲームが見つかりません" }
        }

        // ゲームタイトルからリモートパスを生成（アップロード処理と同じ形式）
        const remotePath = createRemotePath(game.title)

        try {
          // リモートパス配下のオブジェクトを検索
          const objects = await getAllObjectKeys(s3Client, bucketName, remotePath)

          if (objects.length === 0) {
            return {
              success: true,
              data: {
                exists: false,
                totalSize: 0,
                files: []
              }
            }
          }

          // 各ファイルの詳細情報を取得（10件ずつバッチ処理で効率化）
          const batchSize = 10 // 同時実行数を制限
          const fileDetails: Array<{
            name: string
            size: number
            lastModified: Date
            key: string
          }> = []

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
                  // フォールバック: ListObjectsV2の情報を使用
                  const fileName = obj.key.split("/").pop() || obj.key
                  return {
                    name: fileName,
                    size: 0,
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
            success: true,
            data: {
              exists: true,
              totalSize,
              files: fileDetails
            }
          }
        } catch (error) {
          if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
            return {
              success: true,
              data: {
                exists: false,
                totalSize: 0,
                files: []
              }
            }
          }
          throw error
        }
      }
    )
  )
}
