/**
 * @fileoverview セーブデータフォルダのクラウドアップロード機能
 *
 * このハンドラーは、ローカルのセーブデータフォルダを再帰的にスキャンし、
 * すべてのファイルをR2/S3クラウドストレージにアップロードします。
 *
 * 主な処理フロー：
 * 1. 認証情報の検証とR2クライアントの作成
 * 2. ローカルフォルダの再帰的ファイルスキャン
 * 3. 各ファイルの読み込みとクラウドへのアップロード
 * 4. 相対パス構造の保持（ローカルの階層構造をクラウドでも維持）
 *
 * エラーハンドリング：
 * - AWS SDK固有エラーの詳細分析
 * - ネットワーク・権限・ファイルアクセスエラーの適切な処理
 */

import { readdir, readFile } from "fs/promises"
import { join, relative } from "path"
import { ipcMain } from "electron"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { ApiResult } from "../../types/result"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { validateCredentialsForR2 } from "../utils/credentialValidator"

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

        // 各ファイルのアップロード
        for (const filePath of filePaths) {
          const fileBody = await readFile(filePath)
          const relativePath = relative(localPath, filePath)
          const r2Key = createS3KeyFromFilePath(remotePath, relativePath)

          const cmd = new PutObjectCommand({
            Bucket: credentials.bucketName,
            Key: r2Key,
            Body: fileBody
          })
          await r2Client.send(cmd)
        }

        return { success: true }
      }
    )
  )
}
