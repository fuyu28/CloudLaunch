/**
 * @fileoverview セーブデータアップロードサービス
 *
 * このサービスは、ローカルフォルダをクラウドストレージにアップロードする
 * ビジネスロジックを提供します。
 *
 * 主な機能：
 * - セーブデータフォルダ一括アップロード
 * - ファイル再帰取得
 * - バッチ処理による効率的なアップロード
 * - セキュリティ対策（パストラバーサル攻撃対策）
 * - ファイルサイズに基づくストリーミング処理
 */

import { createReadStream } from "fs"
import { readdir, readFile, stat } from "fs/promises"
import { join, relative } from "path"

import { uploadObject } from "./cloudStorageService"
import type { ApiResult } from "../../types/result"
import { BATCH_SIZES } from "../constants/processing"
import { withErrorHandling } from "../utils/commonErrorHandlers"
import { logger } from "../utils/logger"
import type { S3Client } from "@aws-sdk/client-s3"

// ストリーミング処理の閾値（MB）
const STREAM_THRESHOLD_MB = 10

/**
 * ファイルパスから S3 キーを生成します
 *
 * @param remotePath リモートパス
 * @param relativePath 相対パス
 * @returns S3キー
 */
export function createS3KeyFromFilePath(remotePath: string, relativePath: string): string {
  return join(remotePath, relativePath).replace(/\\/g, "/")
}

/**
 * ディレクトリ内のファイルを再帰的に取得します
 *
 * @param dir ディレクトリパス
 * @returns Promise<string[]> ファイルパスの配列
 */
export async function getFilePathsRecursive(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true })
  const paths = await Promise.all(
    dirents.map(async (dirent) => {
      const res = join(dir, dirent.name)
      return dirent.isDirectory() ? getFilePathsRecursive(res) : res
    })
  )
  return Array.prototype.concat(...paths)
}

/**
 * セーブデータフォルダを一括アップロードします
 *
 * @param s3Client S3クライアント
 * @param bucketName バケット名
 * @param localPath ローカルフォルダパス
 * @param remotePath リモートパス
 * @returns Promise<ApiResult<boolean>> アップロード結果
 */
export async function uploadSaveDataFolder(
  s3Client: S3Client,
  bucketName: string,
  localPath: string,
  remotePath: string
): Promise<ApiResult<boolean>> {
  return withErrorHandling(async () => {
    // ファイルパスの取得
    const filePaths = await getFilePathsRecursive(localPath)

    // 各ファイルのアップロード（並列処理で効率化）
    const batchSize = BATCH_SIZES.UPLOAD_DOWNLOAD // 同時アップロード数を制限（ネットワーク負荷を考慮）
    const validFilePaths: string[] = []

    // まず有効なファイルパスをフィルタリング
    for (const filePath of filePaths) {
      const relativePath = relative(localPath, filePath)

      // パストラバーサル攻撃対策: 相対パスが上位ディレクトリを参照していないかチェック
      if (relativePath.startsWith("../") || relativePath.includes("/../")) {
        logger.warn(`パストラバーサル攻撃の可能性があるパスをスキップ: ${filePath}`)
        continue
      }

      // ファイルパスがlocalPath内にあることを確認
      if (!filePath.startsWith(localPath)) {
        logger.warn(`不正なファイルパスをスキップ: ${filePath}`)
        continue
      }

      validFilePaths.push(filePath)
    }

    // バッチ処理でアップロード
    for (let i = 0; i < validFilePaths.length; i += batchSize) {
      const batch = validFilePaths.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (filePath) => {
          const relativePath = relative(localPath, filePath)
          const r2Key = createS3KeyFromFilePath(remotePath, relativePath)

          // ファイルサイズを取得してストリーミングの必要性を判断
          const fileStats = await stat(filePath)
          const fileSizeInMB = fileStats.size / (1024 * 1024)

          let fileBody: Buffer | ReturnType<typeof createReadStream>

          if (fileSizeInMB > STREAM_THRESHOLD_MB) {
            // 大容量ファイルはストリーミング処理
            fileBody = createReadStream(filePath)
            logger.debug(
              `大容量ファイルをストリーミングでアップロード: ${relativePath} (${fileSizeInMB.toFixed(1)}MB)`
            )
          } else {
            // 小容量ファイルは従来通りメモリ読み込み
            fileBody = await readFile(filePath)
            logger.debug(
              `小容量ファイルをメモリ読み込みでアップロード: ${relativePath} (${fileSizeInMB.toFixed(1)}MB)`
            )
          }

          await uploadObject(s3Client, bucketName, r2Key, fileBody)
          logger.debug(`アップロード完了: ${relativePath}`)
        })
      )
      logger.info(
        `アップロード進捗: ${Math.min(i + batchSize, validFilePaths.length)}/${validFilePaths.length}`
      )
    }

    return true
  }, "セーブデータフォルダアップロード")
}
