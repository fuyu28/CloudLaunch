/**
 * @fileoverview ゲームセーブデータ操作フック
 *
 * このフックは、ゲームのセーブデータのアップロード・ダウンロード機能を提供します。
 *
 * 主な機能：
 * - セーブデータのクラウドアップロード
 * - セーブデータのクラウドダウンロード
 * - ローディング状態の管理
 * - エラーハンドリング
 * - バリデーション
 *
 * 使用例：
 * ```tsx
 * const {
 *   uploadSaveData,
 *   downloadSaveData,
 *   isUploading,
 *   isDownloading
 * } = useGameSaveData()
 * ```
 */

import { handleApiError, withLoadingToast } from "@renderer/utils/errorHandler"
import { useState, useCallback } from "react"

import type { GameType } from "../../../types/game"
import { createRemotePath } from "../../../utils"

/**
 * ゲームセーブデータ操作フックの戻り値
 */
export interface GameSaveDataResult {
  /** セーブデータアップロード関数 */
  uploadSaveData: (game: GameType) => Promise<void>
  /** セーブデータダウンロード関数 */
  downloadSaveData: (game: GameType) => Promise<void>
  /** アップロード中かどうか */
  isUploading: boolean
  /** ダウンロード中かどうか */
  isDownloading: boolean
}

/**
 * ゲームセーブデータ操作フック
 *
 * ゲームのセーブデータのアップロード・ダウンロード機能を提供します。
 *
 * @returns セーブデータ操作機能とローディング状態
 */
export function useGameSaveData(): GameSaveDataResult {
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  /**
   * セーブデータをクラウドにアップロードする
   *
   * @param game アップロード対象のゲーム
   */
  const uploadSaveData = useCallback(async (game: GameType): Promise<void> => {
    // セーブフォルダパスの存在チェック
    if (!game.saveFolderPath) {
      handleApiError({
        success: false,
        message: "セーブデータフォルダが設定されていません。"
      })
      return
    }

    setIsUploading(true)

    try {
      // リモートパスの生成（ゲームタイトルベース）
      const remotePath = createRemotePath(game.title)

      // アップロード実行（トースト付き）
      await withLoadingToast(
        () => window.api.saveData.upload.uploadSaveDataFolder(game.saveFolderPath!, remotePath),
        "セーブデータをアップロード中…",
        "セーブデータのアップロードに成功しました。",
        "セーブデータのアップロード"
      )
    } finally {
      setIsUploading(false)
    }
  }, [])

  /**
   * セーブデータをクラウドからダウンロードする
   *
   * @param game ダウンロード対象のゲーム
   */
  const downloadSaveData = useCallback(async (game: GameType): Promise<void> => {
    // セーブフォルダパスの存在チェック
    if (!game.saveFolderPath) {
      handleApiError({
        success: false,
        message: "セーブデータフォルダが設定されていません。"
      })
      return
    }

    setIsDownloading(true)

    try {
      // リモートパスの生成（ゲームタイトルベース）
      const remotePath = createRemotePath(game.title)

      // ダウンロード実行（トースト付き）
      await withLoadingToast(
        () => window.api.saveData.download.downloadSaveData(game.saveFolderPath!, remotePath),
        "セーブデータをダウンロード中…",
        "セーブデータのダウンロードに成功しました。",
        "セーブデータのダウンロード"
      )
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    uploadSaveData,
    downloadSaveData,
    isUploading,
    isDownloading
  }
}

export default useGameSaveData
