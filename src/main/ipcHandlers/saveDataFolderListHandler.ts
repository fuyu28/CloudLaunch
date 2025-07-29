/**
 * @fileoverview リモートセーブデータフォルダ一覧取得のIPC通信ハンドラー
 *
 * このファイルは、R2/S3クラウドストレージ上のセーブデータフォルダ一覧を取得する機能を提供します。
 *
 * 提供する機能：
 * - リモートセーブデータフォルダ一覧取得（list-remote-save-data-folders）
 *
 * 技術的特徴：
 * - ListObjectsV2Command の Delimiter="/" 機能を使用
 * - 第1階層のフォルダのみを取得（サブディレクトリは除外）
 * - CommonPrefixes を使用したフォルダ一覧の効率的な取得
 *
 * セキュリティ機能：
 * - 認証情報の事前検証
 * - S3バケットへのアクセス権限確認
 * - エラー時の適切なundefined返却（機密情報の漏洩防止）
 *
 * 注意事項：
 * - エラー発生時はundefinedを返却（詳細なエラー情報は非公開）
 * - 認証情報が未設定の場合もundefinedを返却
 * - パフォーマンス重視でページネーション未対応（第1ページのみ）
 */

import { ipcMain } from "electron"

import { creates3Client } from "../s3Client"
import { listFolders } from "../service/cloudStorageService"
import { getCredential } from "../service/credentialService"
import { logger } from "../utils/logger"

export function registerSaveDataFolderListHandler(): void {
  /**
   * リモートセーブデータフォルダ一覧取得API
   *
   * R2/S3クラウドストレージのルート階層にあるフォルダ一覧を取得します。
   *
   * 処理詳細：
   * 1. 認証情報の検証（credentialServiceを使用）
   * 2. R2クライアントの作成
   * 3. ListObjectsV2Command でバケット内のフォルダをリスト取得
   * 4. Delimiter="/" により第1階層のフォルダのみを取得
   * 5. CommonPrefixes から実際のフォルダ名を抽出
   * 6. 末尾のスラッシュを除去して返却
   *
   * 技術的詳細：
   * - Delimiter 機能により効率的なフォルダ一覧取得
   * - 正規表現でパス区切り文字（/または\）の除去
   * - エラー時はundefined返却（セキュリティ考慮）
   *
   * 戻り値形式：
   * - 成功時: フォルダ名文字列の配列（例: ["game1", "game2"]）
   * - 失敗時: undefined
   * - フォルダが存在しない場合: undefined
   *
   * @returns Promise<string[] | undefined> フォルダ一覧（成功時）またはundefined（失敗時）
   */
  ipcMain.handle("list-remote-save-data-folders", async (): Promise<string[] | undefined> => {
    try {
      const s3Client = await creates3Client()
      const credsResult = await getCredential()
      if (!credsResult.success || !credsResult.data) {
        throw new Error(
          credsResult.success ? "R2/S3 クレデンシャルが設定されていません" : credsResult.message
        )
      }
      const creds = credsResult.data
      const folders = await listFolders(s3Client, creds.bucketName)
      return folders.length > 0 ? folders : undefined
    } catch (err) {
      logger.error("リモートセーブデータフォルダ一覧取得エラー:", err)
      return undefined
    }
  })
}
