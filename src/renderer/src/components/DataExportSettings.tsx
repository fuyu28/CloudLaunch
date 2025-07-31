/**
 * @fileoverview データエクスポート設定コンポーネント
 *
 * データベースの全データをCSV、JSON、SQL形式でエクスポートする機能を提供します。
 * ユーザーがエクスポート形式と含めるデータを選択できます。
 *
 * 主な機能：
 * - エクスポート形式の選択（CSV、JSON、SQL）
 * - エクスポート対象テーブルの選択
 * - エクスポート統計の表示
 * - エクスポート実行とプログレス表示
 */

import { useState, useEffect } from "react"

import type { ExportFormat, ExportOptions } from "../../../main/ipcHandlers/dataExportHandlers"
import type React from "react"

interface ExportStats {
  gamesCount: number
  playSessionsCount: number
  uploadsCount: number
  chaptersCount: number
  memosCount: number
}

/**
 * データエクスポート設定コンポーネント
 *
 * データベースの全データをエクスポートするための設定画面を提供します。
 *
 * @returns データエクスポート設定要素
 */
export default function DataExportSettings(): React.JSX.Element {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json")
  const [includeGames, setIncludeGames] = useState(true)
  const [includePlaySessions, setIncludePlaySessions] = useState(true)
  const [includeUploads, setIncludeUploads] = useState(true)
  const [includeChapters, setIncludeChapters] = useState(true)
  const [includeMemos, setIncludeMemos] = useState(true)
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  /**
   * コンポーネントマウント時にエクスポート統計を取得
   */
  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        const result = await window.api.dataExport.getExportStats()
        if (result.success && result.data) {
          setStats(result.data)
        } else if (!result.success) {
          console.error("統計取得エラー:", result.message)
        }
      } catch (error) {
        console.error("統計取得エラー:", error)
      }
    }

    loadStats()
  }, [])

  /**
   * データエクスポートを実行
   */
  const handleExport = async (): Promise<void> => {
    setIsExporting(true)
    setExportResult(null)
    setExportError(null)

    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeGames,
        includePlaySessions,
        includeUploads,
        includeChapters,
        includeMemos
      }

      const result = await window.api.dataExport.exportData(options)

      if (result.success && result.data) {
        setExportResult(result.data)
      } else if (!result.success) {
        setExportError(result.message)
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "エクスポートに失敗しました")
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * エクスポート形式の表示名を取得
   */
  const getFormatDisplayName = (format: ExportFormat): string => {
    switch (format) {
      case "csv":
        return "CSV"
      case "json":
        return "JSON"
      case "sql":
        return "SQL"
      default:
        return format
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">データエクスポート</h2>
        <p className="text-gray-600 mb-6">
          データベースに保存されているゲーム情報、プレイ記録、メモなどのデータを外部ファイルとしてエクスポートできます。
        </p>
      </div>

      {/* エクスポート統計 */}
      {stats && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">データ統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.gamesCount}</div>
              <div className="text-sm text-gray-600">ゲーム</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.playSessionsCount}</div>
              <div className="text-sm text-gray-600">プレイ記録</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.uploadsCount}</div>
              <div className="text-sm text-gray-600">アップロード</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.chaptersCount}</div>
              <div className="text-sm text-gray-600">チャプター</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.memosCount}</div>
              <div className="text-sm text-gray-600">メモ</div>
            </div>
          </div>
        </div>
      )}

      {/* エクスポート設定 */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title mb-4">エクスポート設定</h3>

          {/* エクスポート形式選択 */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">エクスポート形式</span>
            </label>
            <div className="flex gap-2">
              {(["csv", "json", "sql"] as ExportFormat[]).map((format) => (
                <label key={format} className="label cursor-pointer flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio radio-primary"
                    value={format}
                    checked={exportFormat === format}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  />
                  <span className="label-text">{getFormatDisplayName(format)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* エクスポート対象選択 */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">エクスポート対象</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={includeGames}
                  onChange={(e) => setIncludeGames(e.target.checked)}
                />
                <span className="label-text">ゲーム情報</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={includePlaySessions}
                  onChange={(e) => setIncludePlaySessions(e.target.checked)}
                />
                <span className="label-text">プレイ記録</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={includeUploads}
                  onChange={(e) => setIncludeUploads(e.target.checked)}
                />
                <span className="label-text">アップロード履歴</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={includeChapters}
                  onChange={(e) => setIncludeChapters(e.target.checked)}
                />
                <span className="label-text">チャプター</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={includeMemos}
                  onChange={(e) => setIncludeMemos(e.target.checked)}
                />
                <span className="label-text">メモ</span>
              </label>
            </div>
          </div>

          {/* エクスポートボタン */}
          <div className="form-control">
            <button
              className={`btn btn-primary ${isExporting ? "loading" : ""}`}
              onClick={handleExport}
              disabled={
                isExporting ||
                (!includeGames &&
                  !includePlaySessions &&
                  !includeUploads &&
                  !includeChapters &&
                  !includeMemos)
              }
            >
              {isExporting
                ? "エクスポート中..."
                : `${getFormatDisplayName(exportFormat)}でエクスポート`}
            </button>
          </div>
        </div>
      </div>

      {/* エクスポート結果 */}
      {exportResult && (
        <div className="alert alert-success">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">エクスポート完了</h3>
              <div className="text-xs">ファイル: {exportResult}</div>
            </div>
          </div>
        </div>
      )}

      {/* エクスポートエラー */}
      {exportError && (
        <div className="alert alert-error">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">エクスポートエラー</h3>
              <div className="text-xs">{exportError}</div>
            </div>
          </div>
        </div>
      )}

      {/* ヘルプ情報 */}
      <div className="bg-info bg-opacity-10 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">エクスポート形式について</h4>
        <ul className="text-sm space-y-1">
          <li>
            <strong>CSV:</strong>{" "}
            表計算ソフトで開きやすい形式。各テーブルが別々のセクションとして出力されます。
          </li>
          <li>
            <strong>JSON:</strong>{" "}
            プログラムで処理しやすい構造化データ形式。全データが階層構造で保存されます。
          </li>
          <li>
            <strong>SQL:</strong> データベースに再インポート可能なSQL INSERT文形式で出力されます。
          </li>
        </ul>
      </div>
    </div>
  )
}
