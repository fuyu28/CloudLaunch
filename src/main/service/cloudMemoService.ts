/**
 * @fileoverview クラウドメモサービス
 *
 * クラウドストレージのメモ操作に関するビジネスロジックを提供します。
 * - クラウドメモの一覧取得
 * - クラウドメモの個別ダウンロード
 * - クラウドメモのアップロード
 */

import { getAllObjectsWithMetadata, uploadObject, downloadObject } from "./cloudStorageService"
import { generateMemoFileContent } from "./memoSyncService"
import type { CloudMemoInfo } from "../../types/memo"
import { CloudPathManager } from "../utils/cloudPathManager"
import { logger } from "../utils/logger"
import type { S3Client } from "@aws-sdk/client-s3"

/**
 * クラウドストレージからメモ一覧を取得します
 */
export async function getCloudMemos(
  s3Client: S3Client,
  bucketName: string
): Promise<CloudMemoInfo[]> {
  try {
    // 汎用的なオブジェクト取得関数を使用
    const objects = await getAllObjectsWithMetadata(s3Client, bucketName, "games/")
    const cloudMemos: CloudMemoInfo[] = []

    for (const object of objects) {
      // メモファイルのみを処理
      if (!CloudPathManager.isMemoPath(object.key)) {
        continue
      }

      // CloudPathManagerを使用してメモ情報を抽出
      const memoInfo = CloudPathManager.extractMemoInfo(object.key)
      if (!memoInfo) {
        continue
      }

      const fileName = object.key.split("/").pop() || ""

      cloudMemos.push({
        key: object.key,
        fileName,
        gameTitle: memoInfo.gameTitle,
        memoTitle: memoInfo.memoTitle,
        memoId: memoInfo.memoId,
        lastModified: object.lastModified,
        size: object.size
      })
    }

    logger.info(`クラウドメモ一覧を取得しました: ${cloudMemos.length}件`)
    return cloudMemos
  } catch (error) {
    logger.error("クラウドメモ一覧取得エラー:", error)
    throw error
  }
}

/**
 * クラウドストレージからメモをダウンロードします
 */
export async function downloadMemoFromCloud(
  s3Client: S3Client,
  bucketName: string,
  gameTitle: string,
  memoFileName: string
): Promise<string> {
  try {
    // CloudPathManagerを使用してパスを生成
    const objectKey = `games/${gameTitle}/memo/${memoFileName}`

    // 汎用的なダウンロード関数を使用
    const content = await downloadObject(s3Client, bucketName, objectKey)
    return content
  } catch (error) {
    logger.error("メモクラウドダウンロードエラー:", error)
    throw error
  }
}

/**
 * メモをクラウドストレージに保存します
 */
export async function uploadMemoToCloud(
  s3Client: S3Client,
  bucketName: string,
  memo: {
    id: string
    title: string
    content: string
    game: { title: string }
  }
): Promise<void> {
  try {
    // CloudPathManagerを使用してパスを生成
    const objectKey = CloudPathManager.buildMemoPath(memo.game.title, memo.title, memo.id)

    // メモファイル内容を生成
    const fileContent = generateMemoFileContent(memo.title, memo.content, memo.game.title)

    // 汎用的なアップロード関数を使用
    await uploadObject(s3Client, bucketName, objectKey, fileContent, "text/markdown")
  } catch (error) {
    logger.error("メモクラウド保存エラー:", error)
    throw error
  }
}
