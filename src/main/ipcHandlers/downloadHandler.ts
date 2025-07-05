/**
 * @fileoverview セーブデータのクラウドダウンロード機能
 *
 * このハンドラーは、R2/S3クラウドストレージからローカルへのセーブデータ
 * 一括ダウンロード機能を提供します。
 *
 * 主な処理フロー：
 * 1. 認証情報の検証とR2クライアントの作成
 * 2. リモートパス配下のすべてのオブジェクトをリスト取得
 * 3. 各オブジェクトをストリーミングダウンロード
 * 4. ローカルディレクトリ構造の再構築
 *
 * 技術的特徴：
 * - ページネーション対応のオブジェクト一覧取得
 * - メモリ効率的なストリーミングダウンロード
 * - 相対パス構造の保持（リモートの階層構造をローカルでも維持）
 * - 自動ディレクトリ作成（mkdir -p 相当）
 *
 * エラーハンドリング：
 * - AWS SDK固有エラーの詳細分析
 * - ネットワーク・権限・ファイルシステムエラーの適切な処理
 */

import { join, dirname, relative } from "path"
import { promises as fs } from "fs"
import { ipcMain } from "electron"
import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"
import { ApiResult } from "../../types/result"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { validateCredentialsForR2 } from "../utils/credentialValidator"

/**
 * リモートパス配下のすべてのオブジェクトキーを取得する関数
 *
 * ページネーション対応により、大量のオブジェクトが存在する場合でも
 * すべてのキーを取得できます。
 *
 * @param r2Client S3 クライアント
 * @param bucketName バケット名
 * @param remotePath リモートパス（プレフィックス）
 * @returns Promise<string[]> オブジェクトキーの配列
 */
async function getAllObjectKeys(
  r2Client: S3Client,
  bucketName: string,
  remotePath: string
): Promise<string[]> {
  const allKeys: string[] = []
  let token: string | undefined = undefined

  do {
    const listResult = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: remotePath.replace(/\/+$/, "") + "/",
        ContinuationToken: token
      })
    )

    listResult.Contents?.forEach((obj) => {
      if (obj.Key) allKeys.push(obj.Key)
    })

    token = listResult.NextContinuationToken
  } while (token)

  return allKeys
}

/**
 * 単一ファイルをダウンロードする関数
 *
 * ストリーミング処理により、メモリ効率的にファイルをダウンロードします。
 *
 * @param r2Client S3 クライアント
 * @param bucketName バケット名
 * @param key オブジェクトキー
 * @param outputPath 出力ファイルパス
 * @returns Promise<void>
 */
async function downloadFile(
  r2Client: S3Client,
  bucketName: string,
  key: string,
  outputPath: string
): Promise<void> {
  const getResult = await r2Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })
  )

  const bodyStream = getResult.Body as NodeJS.ReadableStream
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

        const { credentials, r2Client } = validationResult.data!

        // リモートオブジェクトの一覧取得
        const allKeys = await getAllObjectKeys(r2Client, credentials.bucketName, remotePath)

        // 各ファイルのダウンロード
        for (const key of allKeys) {
          const relativePath = relative(remotePath, key)
          const outputPath = join(localPath, relativePath)

          // ディレクトリの作成
          await fs.mkdir(dirname(outputPath), { recursive: true })

          // ファイルのダウンロード
          await downloadFile(r2Client, credentials.bucketName, key, outputPath)
        }

        return { success: true }
      }
    )
  )
}
