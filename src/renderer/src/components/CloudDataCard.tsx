/**
 * @fileoverview クラウドデータ管理カードコンポーネント
 *
 * セーブデータのアップロード・ダウンロード機能と
 * クラウド上のデータ情報を表示するカードコンポーネントです。
 */

import { useCallback, useEffect, useState } from "react"
import { FaUpload, FaDownload, FaCloud, FaCloudDownloadAlt } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

interface CloudDataInfo {
  exists: boolean
  uploadedAt?: Date
  size?: number
  comment?: string
}

interface CloudDataCardProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** セーブフォルダパスが設定されているか */
  hasSaveFolder: boolean
  /** 認証情報が有効か */
  isValidCreds: boolean
  /** アップロード処理中か */
  isUploading: boolean
  /** ダウンロード処理中か */
  isDownloading: boolean
  /** アップロード処理 */
  onUpload: () => Promise<void>
  /** ダウンロード処理 */
  onDownload: () => Promise<void>
}

/**
 * クラウドデータ管理カードコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns クラウドデータカードコンポーネント
 */
export default function CloudDataCard({
  gameId,
  hasSaveFolder,
  isValidCreds,
  isUploading,
  isDownloading,
  onUpload,
  onDownload
}: CloudDataCardProps): React.JSX.Element {
  const { formatDate } = useTimeFormat()
  const [cloudData, setCloudData] = useState<CloudDataInfo>({ exists: false })
  const [isLoading, setIsLoading] = useState(true)

  // クラウドデータ情報を取得
  const fetchCloudData = useCallback(async () => {
    if (!isValidCreds || !gameId) return

    try {
      setIsLoading(true)
      const result = await window.api.saveData.download.getCloudDataInfo(gameId)

      if (result.success && result.data) {
        setCloudData({
          exists: true,
          uploadedAt: result.data.uploadedAt,
          size: result.data.size,
          comment: result.data.comment
        })
      } else {
        setCloudData({ exists: false })
      }
    } catch (error) {
      console.error("クラウドデータ情報の取得に失敗:", error)
      setCloudData({ exists: false })
    } finally {
      setIsLoading(false)
    }
  }, [gameId, isValidCreds])

  useEffect(() => {
    fetchCloudData()
  }, [fetchCloudData])

  // アップロード完了後にデータを再取得
  const handleUpload = useCallback(async () => {
    await onUpload()
    await fetchCloudData()
  }, [onUpload, fetchCloudData])

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "不明"

    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <FaCloud className="text-info" />
          クラウドデータ管理
        </h3>

        {/* クラウドデータ情報 */}
        <div className="mb-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-base-content/60">
              <span className="loading loading-spinner loading-sm"></span>
              <span>データ情報を取得中...</span>
            </div>
          ) : cloudData.exists ? (
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaCloudDownloadAlt className="text-success" />
                <span className="font-medium">クラウドデータが存在します</span>
              </div>

              <div className="space-y-1 text-sm text-base-content/70">
                {cloudData.uploadedAt && (
                  <div>アップロード日時: {formatDate(cloudData.uploadedAt)}</div>
                )}
                {cloudData.size && <div>ファイルサイズ: {formatFileSize(cloudData.size)}</div>}
                {cloudData.comment && <div>コメント: {cloudData.comment}</div>}
              </div>
            </div>
          ) : (
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-base-content/60">
                <FaCloud />
                <span>クラウドデータは存在しません</span>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="card-actions justify-end gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleUpload}
            disabled={!hasSaveFolder || !isValidCreds || isUploading || isDownloading}
          >
            {isUploading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                アップロード中...
              </>
            ) : (
              <>
                <FaUpload />
                アップロード
              </>
            )}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={onDownload}
            disabled={!cloudData.exists || !isValidCreds || isUploading || isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                ダウンロード中...
              </>
            ) : (
              <>
                <FaDownload />
                ダウンロード
              </>
            )}
          </button>
        </div>

        {/* 警告メッセージ */}
        {!isValidCreds && (
          <div className="alert alert-warning mt-2">
            <span className="text-xs">
              クラウド機能を使用するには設定画面で認証情報を入力してください
            </span>
          </div>
        )}

        {!hasSaveFolder && isValidCreds && (
          <div className="alert alert-info mt-2">
            <span className="text-xs">セーブフォルダが設定されていません</span>
          </div>
        )}
      </div>
    </div>
  )
}
