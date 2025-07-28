/**
 * @fileoverview セーブデータフォルダのクラウドアップロード機能
 *
 * このハンドラーは、ローカルのセーブデータフォルダを再帰的にスキャンし、
 * すべてのファイルをR2/S3クラウドストレージにアップロードします。
 *
 * 主な処理フロー：
 * 1. 認証情報の検証とR2クライアントの作成
 * 2. ローカルフォルダの再帰的ファイルスキャン
 * 3. パストラバーサル攻撃対策による安全性検証
 * 4. ファイルサイズに応じた最適化処理（ストリーミング vs メモリ読み込み）
 * 5. 5件ずつの並列バッチ処理でクラウドへアップロード
 * 6. 相対パス構造の保持（ローカルの階層構造をクラウドでも維持）
 *
 * 技術的特徴：
 * - 10MB以上のファイルはストリーミング処理（メモリ効率化）
 * - 5件ずつの並列バッチ処理によるアップロード効率化
 * - パストラバーサル攻撃対策（../パスの検証）
 * - 進捗表示とエラー時の詳細ログ
 *
 * エラーハンドリング：
 * - AWS SDK固有エラーの詳細分析
 * - ネットワーク・権限・ファイルアクセスエラーの適切な処理
 */

import { createReadStream } from "fs"
import { readdir, readFile, stat } from "fs/promises"
import { join, relative } from "path"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { ipcMain } from "electron"

import type { ApiResult } from "../../types/result"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { logger } from "../utils/logger"
import type { ReadStream } from "fs"

/**
 * ディレクトリを再帰的にスキャンしてすべてのファイルパスを取得
 *
 * この関数は、指定されたディレクトリとそのサブディレクトリを再帰的に探索し、
 * 含まれるすべてのファイルの絶対パスをフラットな配列として返します。
 *
 * 処理アルゴリズム：
 * 1. readdir() でディレクトリエントリを取得（withFileTypes: true）
 * 2. 各エントリに対して並行処理：
 *    - ディレクトリの場合: 再帰的に getFilePathsRecursive() を呼び出し
 *    - ファイルの場合: そのパスを返す
 * 3. Promise.all() で並行処理を待機
 * 4. Array.prototype.concat() でネストした配列をフラット化
 *
 * @param dir スキャン対象のディレクトリパス
 * @returns Promise<string[]> 発見されたすべてのファイルパスの配列
 */
async function getFilePathsRecursive(dir: string): Promise<string[]> {
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
 * ファイルパスから S3 キーを作成する関数
 *
 * ローカルファイルパスの相対パスを S3 オブジェクトキーに変換します。
 * Windows のバックスラッシュをスラッシュに変換して、
 * クロスプラットフォーム対応を行います。
 *
 * @param remotePath S3 のベースパス
 * @param relativePath ローカルファイルの相対パス
 * @returns S3 オブジェクトキー
 */
function createS3KeyFromFilePath(remotePath: string, relativePath: string): string {
  return join(remotePath, relativePath).replace(/\\/g, "/")
}

export function registerUploadSaveDataFolderHandlers(): void {
  ipcMain.handle(
    "upload-save-data-folder",
    withFileOperationErrorHandling(
      async (_event, localPath: string, remotePath: string): Promise<ApiResult> => {
        // 認証情報の検証と R2 クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // ファイルパスの取得
        const filePaths = await getFilePathsRecursive(localPath)

        // 各ファイルのアップロード（並列処理で効率化）
        const batchSize = 5 // 同時アップロード数を制限（ネットワーク負荷を考慮）
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
              try {
                const relativePath = relative(localPath, filePath)
                const r2Key = createS3KeyFromFilePath(remotePath, relativePath)

                // ファイルサイズを取得してストリーミングの必要性を判断
                const fileStats = await stat(filePath)
                const fileSizeInMB = fileStats.size / (1024 * 1024)
                const STREAM_THRESHOLD_MB = 10 // 10MB以上はストリーミング処理

                let fileBody: Buffer | ReadStream

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

                const cmd = new PutObjectCommand({
                  Bucket: credentials.bucketName,
                  Key: r2Key,
                  Body: fileBody
                })
                await r2Client.send(cmd)
                logger.debug(`アップロード完了: ${relativePath}`)
              } catch (error) {
                logger.error(`ファイルアップロードに失敗: ${filePath}`, error)
                throw error
              }
            })
          )
          logger.info(
            `アップロード進捗: ${Math.min(i + batchSize, validFilePaths.length)}/${validFilePaths.length}`
          )
        }

        return { success: true }
      }
    )
  )
}
