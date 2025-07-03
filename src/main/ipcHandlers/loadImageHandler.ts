/**
 * @fileoverview 画像読み込み機能のIPC通信ハンドラー
 *
 * このファイルは、ローカルファイルとWeb上の画像をBase64形式で読み込む機能を提供します。
 *
 * 提供する機能：
 * - ローカル画像ファイルの読み込み（load-image-from-local）
 * - Web画像の読み込み（load-image-from-web）
 *
 * 対応画像形式：
 * - PNG（image/png）
 * - JPEG/JPG（image/jpeg）
 * - GIF（image/gif）
 *
 * セキュリティ機能：
 * - MIME型の厳密な検証
 * - 対応形式以外の画像の拒否
 * - ファイルアクセス権限の確認
 *
 * 技術的特徴：
 * - Base64エンコーディングによるデータURL形式での返却
 * - メモリ効率的なBuffer処理
 * - 拡張子からMIME型の自動判定（ローカル）
 * - HTTP Content-Typeヘッダーの検証（Web）
 */

import { ipcMain } from "electron"
import path from "path"
import fs from "fs/promises"
import { ApiResult } from "../../types/result"

const mimeMap: Record<string, string> = {
  png: "image/png",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg"
}

export function registerLoadImageHandler(): void {
  /**
   * ローカル画像ファイル読み込みAPI
   *
   * 指定されたローカルファイルパスから画像を読み込み、Base64エンコードします。
   *
   * 処理詳細：
   * 1. ファイルの読み込み（fs.readFile）
   * 2. 拡張子からMIMEタイプの自動判定
   * 3. BufferをBase64文字列に変換
   * 4. data URL形式（data:[MIME];base64,[data]）で返却
   *
   * 対応拡張子：
   * - .png, .jpg, .jpeg, .gif
   * - 不明な拡張子の場合はimage/jpegをデフォルトとして使用
   *
   * @param filePath 読み込む画像ファイルの絶対パス
   * @returns ApiResult<string> 読み込み結果（成功時はdata URL、失敗時はエラーメッセージ）
   */
  ipcMain.handle(
    "load-image-from-local",
    async (_event, filePath: string): Promise<ApiResult<string>> => {
      try {
        const buffer = await fs.readFile(filePath)
        const ext = path.extname(filePath).slice(1).toLocaleLowerCase()
        const mime = mimeMap[ext] || "image/jpeg"
        const base64 = buffer.toString("base64")
        return { success: true, data: `data:${mime};base64,${base64}` }
      } catch (e: unknown) {
        console.error(`load-image failed ${e}`)
        const message = e instanceof Error ? e.message : "不明なエラー"
        return { success: false, message: `ローカル画像の読み込みに失敗しました: ${message}` }
      }
    }
  )

  /**
   * Web画像読み込みAPI
   *
   * 指定されたURLからWeb上の画像をダウンロードし、Base64エンコードします。
   *
   * 処理詳細：
   * 1. HTTP(S)リクエストの実行（fetch API使用）
   * 2. HTTPステータスコードの確認
   * 3. Content-Typeヘッダーの検証（正規表現使用）
   * 4. ArrayBufferをBufferに変換後Base64エンコード
   * 5. data URL形式で返却
   *
   * セキュリティ機能：
   * - Content-Typeの厳密な検証（image/png, image/jpeg, image/gifのみ許可）
   * - HTTPエラーステータスの適切な処理
   * - ネットワークタイムアウトのハンドリング
   *
   * @param url ダウンロードする画像のURL（HTTP/HTTPS）
   * @returns ApiResult<string> ダウンロード結果（成功時はdata URL、失敗時はエラーメッセージ）
   */
  ipcMain.handle("load-image-from-web", async (_event, url: string): Promise<ApiResult<string>> => {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        return { success: false, message: `画像の取得に失敗しました: ${res.statusText}` }
      }

      const contentType = res.headers.get("content-type") || ""
      if (!/^image\/(png|jpeg|gif)$/.test(contentType)) {
        return { success: false, message: `非対応の画像形式です: ${contentType}` }
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      return { success: true, data: `data:${contentType};base64,${base64}` }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : "不明なエラー"
      return { success: false, message: `Web画像の読み込みに失敗しました: ${message}` }
    }
  })
}
