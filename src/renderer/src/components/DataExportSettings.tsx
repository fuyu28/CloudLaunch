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

import type {
  ExportFormat,
  ExportOptions,
  ImportFormat,
  ImportOptions,
  ImportResult
} from "../../../main/ipcHandlers/dataExportHandlers"
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
  // タブ管理
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")

  // エクスポート状態
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

  // インポート状態
  const [importFormat, setImportFormat] = useState<ImportFormat>("json")
  const [importMode, setImportMode] = useState<"merge" | "replace" | "skip">("merge")
  const [importIncludeGames, setImportIncludeGames] = useState(true)
  const [importIncludePlaySessions, setImportIncludePlaySessions] = useState(true)
  const [importIncludeUploads, setImportIncludeUploads] = useState(true)
  const [importIncludeChapters, setImportIncludeChapters] = useState(true)
  const [importIncludeMemos, setImportIncludeMemos] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [fileAnalysis, setFileAnalysis] = useState<{
    format: ImportFormat | null
    recordCounts: Record<string, number>
    hasValidStructure: boolean
  } | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)

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
   * ファイル選択 → 分析 → インポートを一体で実行
   */
  const handleImport = async (): Promise<void> => {
    setIsImporting(true)
    setImportResult(null)
    setImportError(null)
    setFileAnalysis(null)
    setSelectedFilePath(null)

    try {
      const options: ImportOptions = {
        format: importFormat, // 初期値（自動判定で上書きされる）
        mode: importMode,
        includeGames: importIncludeGames,
        includePlaySessions: importIncludePlaySessions,
        includeUploads: importIncludeUploads,
        includeChapters: importIncludeChapters,
        includeMemos: importIncludeMemos
      }

      const result = await window.api.dataExport.importData(options)

      if (result.success && result.data) {
        // 分析結果を表示
        setFileAnalysis(result.data.analysis)
        setSelectedFilePath(result.data.filePath)

        // 自動判定されたフォーマットで設定を更新
        if (result.data.analysis.format) {
          setImportFormat(result.data.analysis.format)
        }

        // インポート結果がある場合（成功した場合）は表示
        if (result.data.importResult) {
          setImportResult(result.data.importResult)
        }
      } else if (!result.success) {
        setImportError(result.message)
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "インポートに失敗しました")
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * インポートモードの表示名を取得
   */
  const getImportModeDisplayName = (mode: "merge" | "replace" | "skip"): string => {
    switch (mode) {
      case "merge":
        return "マージ（新規追加・既存更新）"
      case "replace":
        return "置換（既存データを上書き）"
      case "skip":
        return "スキップ（既存データは保持）"
      default:
        return mode
    }
  }

  /**
   * エクスポート形式の表示名を取得
   */
  const getFormatDisplayName = (format: ExportFormat | ImportFormat): string => {
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
        <h2 className="text-2xl font-bold mb-4">データエクスポート/インポート</h2>
        <p className="text-gray-600 mb-6">
          データベースに保存されているデータを外部ファイルとしてエクスポートしたり、外部ファイルからデータをインポートできます。
          インポート時はファイル形式が自動判定されます。
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="tabs tabs-lifted mb-6">
        <button
          className={`tab tab-lifted ${activeTab === "export" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          エクスポート
        </button>
        <button
          className={`tab tab-lifted ${activeTab === "import" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("import")}
        >
          インポート
        </button>
      </div>

      {/* エクスポートタブの内容 */}
      {activeTab === "export" && (
        <>
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

          {/* エクスポートヘルプ情報 */}
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
                <strong>SQL:</strong> データベースに再インポート可能なSQL
                INSERT文形式で出力されます。
              </li>
            </ul>
          </div>
        </>
      )}

      {/* インポートタブの内容 */}
      {activeTab === "import" && (
        <>
          {/* ファイル分析結果 */}
          {fileAnalysis && (
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">選択されたファイル</h3>
              {selectedFilePath && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600">ファイルパス</div>
                  <div className="text-sm font-mono bg-base-300 p-2 rounded truncate">
                    {selectedFilePath}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">判定形式</div>
                  <div className="font-semibold">
                    {fileAnalysis.format ? getFormatDisplayName(fileAnalysis.format) : "不明"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">構造</div>
                  <div
                    className={`font-semibold ${fileAnalysis.hasValidStructure ? "text-success" : "text-error"}`}
                  >
                    {fileAnalysis.hasValidStructure ? "有効" : "無効"}
                  </div>
                </div>
              </div>
              {Object.keys(fileAnalysis.recordCounts).length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">検出されたレコード数</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(fileAnalysis.recordCounts).map(([table, count]) => (
                      <div key={table} className="text-center">
                        <div className="text-lg font-bold text-primary">{count}</div>
                        <div className="text-xs text-gray-600">{table}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* インポート設定 */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title mb-4">インポート設定</h3>

              {/* インポート形式情報 */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">インポート形式</span>
                </label>
                <div className="text-sm text-gray-600">
                  ファイル選択時に自動判定されます。現在の設定:{" "}
                  <span className="font-medium">{getFormatDisplayName(importFormat)}</span>
                </div>
              </div>

              {/* インポートモード選択 */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">競合時の処理</span>
                </label>
                <div className="space-y-2">
                  {(["merge", "replace", "skip"] as const).map((mode) => (
                    <label key={mode} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="radio"
                        className="radio radio-primary"
                        value={mode}
                        checked={importMode === mode}
                        onChange={(e) =>
                          setImportMode(e.target.value as "merge" | "replace" | "skip")
                        }
                        disabled={isImporting}
                      />
                      <span className="label-text">{getImportModeDisplayName(mode)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* インポート対象選択 */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">インポート対象</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={importIncludeGames}
                      onChange={(e) => setImportIncludeGames(e.target.checked)}
                      disabled={isImporting}
                    />
                    <span className="label-text">ゲーム情報</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={importIncludePlaySessions}
                      onChange={(e) => setImportIncludePlaySessions(e.target.checked)}
                      disabled={isImporting}
                    />
                    <span className="label-text">プレイ記録</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={importIncludeUploads}
                      onChange={(e) => setImportIncludeUploads(e.target.checked)}
                      disabled={isImporting}
                    />
                    <span className="label-text">アップロード履歴</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={importIncludeChapters}
                      onChange={(e) => setImportIncludeChapters(e.target.checked)}
                      disabled={isImporting}
                    />
                    <span className="label-text">チャプター</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={importIncludeMemos}
                      onChange={(e) => setImportIncludeMemos(e.target.checked)}
                      disabled={isImporting}
                    />
                    <span className="label-text">メモ</span>
                  </label>
                </div>
              </div>

              {/* インポートボタン */}
              <div className="form-control">
                <button
                  className={`btn btn-primary ${isImporting ? "loading" : ""}`}
                  onClick={handleImport}
                  disabled={
                    isImporting ||
                    (!importIncludeGames &&
                      !importIncludePlaySessions &&
                      !importIncludeUploads &&
                      !importIncludeChapters &&
                      !importIncludeMemos)
                  }
                >
                  {isImporting ? "処理中..." : "ファイルを選択してインポート"}
                </button>
              </div>
            </div>
          </div>

          {/* インポート結果 */}
          {importResult && (
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
                  <h3 className="font-bold">インポート完了</h3>
                  <div className="text-xs">
                    成功: {importResult.successfulImports}件 / スキップ:{" "}
                    {importResult.skippedRecords}件 / エラー: {importResult.errors.length}件
                  </div>
                  {importResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">エラー詳細</summary>
                      <div className="mt-2 space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs">
                            {error.table}: {error.error}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs">
                            他 {importResult.errors.length - 5} 件のエラー...
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* インポートエラー */}
          {importError && (
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
                  <h3 className="font-bold">インポートエラー</h3>
                  <div className="text-xs">{importError}</div>
                </div>
              </div>
            </div>
          )}

          {/* インポートヘルプ情報 */}
          <div className="bg-warning bg-opacity-10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ インポート時の注意事項</h4>
            <ul className="text-sm space-y-1">
              <li>
                <strong>バックアップ推奨:</strong>{" "}
                インポート前に現在のデータをエクスポートしてバックアップを取ることを推奨します。
              </li>
              <li>
                <strong>形式について:</strong>{" "}
                CloudLaunchでエクスポートしたファイルの使用を推奨します。
              </li>
              <li>
                <strong>競合処理:</strong>{" "}
                同じIDのデータが存在する場合の処理方法を選択してください。
              </li>
              <li>
                <strong>関連性:</strong> プレイ記録やメモは関連するゲームが存在する必要があります。
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
