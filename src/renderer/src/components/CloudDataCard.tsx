/**
 * @fileoverview クラウドデータ管理カードコンポーネント
 *
 * セーブデータのアップロード・ダウンロード機能と
 * クラウド上のデータ情報を表示するカードコンポーネントです。
 */

import { useCallback, useEffect, useState, memo } from "react"
import { FaUpload, FaDownload, FaCloud, FaCloudDownloadAlt, FaFile } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

interface CloudDataInfo {
  exists: boolean
  uploadedAt?: Date
  size?: number
  comment?: string
}

interface CloudFileDetails {
  exists: boolean
  totalSize: number
  files: Array<{
    name: string
    size: number
    lastModified: Date
    key: string
  }>
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
function CloudDataCard({
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
  const [fileDetails, setFileDetails] = useState<CloudFileDetails | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFileDetailsLoading, setIsFileDetailsLoading] = useState(false)
  const [lastFetchedGameId, setLastFetchedGameId] = useState<string | undefined>(undefined)

  // ファイル詳細情報を取得
  const fetchFileDetails = useCallback(
    async (forceRefresh = false) => {
      if (!isValidCreds || !gameId) return

      // 同じゲームIDで既にデータを取得済みの場合はスキップ（強制リフレッシュ以外）
      if (!forceRefresh && lastFetchedGameId === gameId && fileDetails !== undefined) {
        setIsLoading(false)
        return
      }

      try {
        setIsFileDetailsLoading(true)
        const result = await window.api.saveData.download.getCloudFileDetails(gameId)

        if (result.success && result.data) {
          setFileDetails(result.data)
          setLastFetchedGameId(gameId)

          // ファイル詳細情報から基本情報も設定
          if (result.data.exists) {
            const latestFile = result.data.files.sort(
              (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            )[0]

            setCloudData({
              exists: true,
              uploadedAt: latestFile?.lastModified,
              size: result.data.totalSize,
              comment: ""
            })
          } else {
            setCloudData({ exists: false })
          }
        } else {
          setFileDetails({ exists: false, totalSize: 0, files: [] })
          setCloudData({ exists: false })
          setLastFetchedGameId(gameId)
        }
      } catch (error) {
        console.error("ファイル詳細情報の取得に失敗:", error)
        setFileDetails({ exists: false, totalSize: 0, files: [] })
        setCloudData({ exists: false })
        setLastFetchedGameId(gameId)
      } finally {
        setIsFileDetailsLoading(false)
        setIsLoading(false)
      }
    },
    [fileDetails, gameId, isValidCreds, lastFetchedGameId]
  )

  // gameIdが変わった場合に状態をリセット
  useEffect(() => {
    if (lastFetchedGameId !== gameId) {
      setIsLoading(true)
      setCloudData({ exists: false })
      setFileDetails(undefined)
    }
  }, [gameId, lastFetchedGameId])

  useEffect(() => {
    // gameIdまたはisValidCredsが変わった場合のみ実行
    if (gameId && isValidCreds) {
      fetchFileDetails()
    }
  }, [gameId, isValidCreds, fetchFileDetails]) // fetchFileDetailsを依存配列から削除

  // アップロード完了後にデータを再取得
  const handleUpload = useCallback(async () => {
    await onUpload()
    await fetchFileDetails(true) // 強制リフレッシュ
  }, [onUpload, fetchFileDetails])

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
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body flex flex-col h-full">
        <div className="flex justify-between items-center pb-4">
          <h3 className="card-title flex items-center gap-2">
            <FaCloud className="text-info" />
            クラウドデータ管理
          </h3>
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
        </div>

        {/* クラウドデータ情報 */}
        <div className="mb-4 flex-1">
          {isLoading || isFileDetailsLoading ? (
            <div className="flex items-center gap-2 text-base-content/60">
              <span className="loading loading-spinner loading-sm"></span>
              <span>データ情報を取得中...</span>
            </div>
          ) : cloudData.exists && fileDetails ? (
            <div className="space-y-7">
              {/* 基本情報 */}
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCloudDownloadAlt className="text-success" />
                  <span className="font-medium">
                    クラウドデータが存在します
                    {cloudData.uploadedAt && ` (${formatDate(cloudData.uploadedAt)})`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-base-content/70">
                  <div>ファイル数: {fileDetails.files.length}</div>
                  <div>総容量: {formatFileSize(fileDetails.totalSize)}</div>
                </div>
              </div>

              {/* ファイル一覧 */}
              {fileDetails.files.length > 0 && (
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaFile className="text-info" />
                    <span className="font-medium text-sm">ファイル一覧</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
                    <div className="space-y-1">
                      {fileDetails.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs p-1 hover:bg-base-300 rounded"
                        >
                          <span className="font-mono truncate flex-1 mr-2">{file.name}</span>
                          <div className="flex gap-2 text-base-content/60">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.lastModified)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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

// propsが変わった場合のみ再レンダリング
export default memo(CloudDataCard)
