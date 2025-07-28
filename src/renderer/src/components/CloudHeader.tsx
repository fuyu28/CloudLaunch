/**
 * @fileoverview クラウドページヘッダーコンポーネント
 *
 * このコンポーネントは、クラウドデータ管理ページのヘッダー部分を
 * 担当し、ビュー切り替えや操作ボタンを提供します。
 *
 * 主な機能：
 * - ビュー切り替え（カード/ツリー）
 * - 全削除ボタン
 * - 更新ボタン
 * - ローディング状態の表示
 */

import { FiTrash2, FiRefreshCw, FiCloud, FiFolder, FiFolderPlus } from "react-icons/fi"

import type { CloudDataItem, CloudDirectoryNode } from "@renderer/hooks/useCloudData"

/**
 * ビューモードの型定義
 */
export type ViewMode = "cards" | "tree"

/**
 * クラウドヘッダーのプロパティ
 */
type CloudHeaderProps = {
  /** 現在のビューモード */
  viewMode: ViewMode
  /** ビューモード変更コールバック */
  onViewModeChange: (mode: ViewMode) => void
  /** クラウドデータ */
  cloudData: CloudDataItem[]
  /** ディレクトリツリー */
  directoryTree: CloudDirectoryNode[]
  /** ローディング状態 */
  loading: boolean
  /** 更新コールバック */
  onRefresh: () => void
  /** 全削除コールバック */
  onDeleteAll: () => void
}

/**
 * クラウドページヘッダーコンポーネント
 *
 * @param props ヘッダーのプロパティ
 * @returns JSX要素
 */
export function CloudHeader({
  viewMode,
  onViewModeChange,
  cloudData,
  directoryTree,
  loading,
  onRefresh,
  onDeleteAll
}: CloudHeaderProps): React.JSX.Element {
  const hasData = cloudData.length > 0 || directoryTree.length > 0

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <FiCloud className="text-3xl text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-base-content">クラウドデータ管理</h1>
          <p className="text-base-content/70">クラウドストレージ上のゲームデータを管理できます</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* ビュー切り替えボタン */}
        <div className="join">
          <button
            className={`btn join-item btn-sm ${viewMode === "cards" ? "btn-active" : ""}`}
            onClick={() => onViewModeChange("cards")}
          >
            <FiFolder className="mr-1" />
            カード
          </button>
          <button
            className={`btn join-item btn-sm ${viewMode === "tree" ? "btn-active" : ""}`}
            onClick={() => onViewModeChange("tree")}
          >
            <FiFolderPlus className="mr-1" />
            ツリー
          </button>
        </div>

        {/* 全削除ボタン */}
        {hasData && (
          <button onClick={onDeleteAll} className="btn btn-error btn-sm gap-2" disabled={loading}>
            <FiTrash2 />
            全て削除
          </button>
        )}

        {/* 更新ボタン */}
        <button onClick={onRefresh} disabled={loading} className="btn btn-primary gap-2">
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          更新
        </button>
      </div>
    </div>
  )
}
