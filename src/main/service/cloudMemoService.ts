/**
 * @fileoverview クラウドメモサービス
 *
 * クラウドストレージのメモ操作に関するビジネスロジックを提供します。
 * - クラウドメモの一覧取得
 * - クラウドメモの個別ダウンロード
 * - クラウドメモのアップロード
 */

import type { S3Client } from "@aws-sdk/client-s3"
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import type { CloudMemoInfo } from "../../types/memo"
import { logger } from "../utils/logger"
import { generateMemoFileContent } from "./memoSyncService"

/**
 * クラウドストレージからメモ一覧を取得します
 */
export async function getCloudMemos(
  r2Client: S3Client,
  bucketName: string
): Promise<CloudMemoInfo[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "games/",
      Delimiter: ""
    })

    const response = await r2Client.send(command)
    const cloudMemos: CloudMemoInfo[] = []

    if (response.Contents) {
      for (const object of response.Contents) {
        if (!object.Key || !object.Key.includes("/memo/") || !object.Key.endsWith(".md")) {
          continue
        }

        // games/[gameTitle]/memo/[memoTitle]_[memoId].md の形式から情報を抽出
        const keyParts = object.Key.split("/")
        if (keyParts.length < 4 || keyParts[0] !== "games" || keyParts[2] !== "memo") {
          continue
        }

        const gameTitle = keyParts[1]
        const fileName = keyParts[3]
        const fileBaseName = fileName.replace(".md", "")

        // ファイル名から memoId を抽出（最後の_以降）
        const lastUnderscoreIndex = fileBaseName.lastIndexOf("_")
        if (lastUnderscoreIndex === -1) {
          continue
        }

        const memoTitle = fileBaseName.substring(0, lastUnderscoreIndex)
        const memoId = fileBaseName.substring(lastUnderscoreIndex + 1)

        cloudMemos.push({
          key: object.Key,
          fileName,
          gameTitle,
          memoTitle,
          memoId,
          lastModified: object.LastModified || new Date(),
          size: object.Size || 0
        })
      }
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
  r2Client: S3Client,
  bucketName: string,
  gameTitle: string,
  memoFileName: string
): Promise<string> {
  try {
    // S3キーを作成
    const sanitizedGameTitle = gameTitle.replace(/[<>:"/\\|?*]/g, "_")
    const s3Key = `games/${sanitizedGameTitle}/memo/${memoFileName}`

    // クラウドからダウンロード
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    })

    const response = await r2Client.send(command)
    const content = await response.Body?.transformToString()

    if (!content) {
      throw new Error("メモ内容が取得できませんでした")
    }

    logger.info(`メモをクラウドからダウンロードしました: ${s3Key}`)
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
  r2Client: S3Client,
  bucketName: string,
  memo: {
    id: string
    title: string
    content: string
    game: { title: string }
  }
): Promise<void> {
  try {
    // S3キーを作成: games/[ゲームタイトル]/memo/[メモタイトル]_[メモID].md
    const sanitizedGameTitle = memo.game.title.replace(/[<>:"/\\|?*]/g, "_")
    const sanitizedMemoTitle = memo.title.replace(/[<>:"/\\|?*]/g, "_")
    const s3Key = `games/${sanitizedGameTitle}/memo/${sanitizedMemoTitle}_${memo.id}.md`

    // メモファイル内容を生成
    const fileContent = generateMemoFileContent(memo.title, memo.content, memo.game.title)

    // クラウドに保存
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: "text/markdown"
    })

    await r2Client.send(command)

    logger.info(`メモをクラウドに保存しました: ${s3Key}`)
  } catch (error) {
    logger.error("メモクラウド保存エラー:", error)
    throw error
  }
}
