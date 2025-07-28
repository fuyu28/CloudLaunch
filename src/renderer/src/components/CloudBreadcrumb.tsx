/**
 * @fileoverview クラウドパンくずリストコンポーネント
 *
 * このコンポーネントは、クラウドデータ管理画面でのナビゲーション用
 * パンくずリストを提供します。
 *
 * 主な機能：
 * - 現在のパス表示
 * - パス階層のナビゲーション
 * - ルートへの戻り機能
 * - 一つ上の階層への戻り機能
 */

import React from "react"
import { FiHome, FiChevronRight, FiArrowLeft } from "react-icons/fi"

/**
 * パンくずリストのプロパティ
 */
type CloudBreadcrumbProps = {
  /** 現在のパス */
  currentPath: string[]
  /** パス移動コールバック */
  onNavigateToPath: (path: string[]) => void
  /** 戻るコールバック */
  onNavigateBack: () => void
}

/**
 * クラウドパンくずリストコンポーネント
 *
 * @param props パンくずリストのプロパティ
 * @returns JSX要素
 */
export function CloudBreadcrumb({
  currentPath,
  onNavigateToPath,
  onNavigateBack
}: CloudBreadcrumbProps): React.JSX.Element | null {
  // ルートレベルの場合はパンくずリストを表示しない
  if (currentPath.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-base-200 rounded-lg">
      {/* ルートに戻るボタン */}
      <button
        onClick={() => onNavigateToPath([])}
        className="btn btn-sm btn-ghost"
        title="ルートに戻る"
      >
        <FiHome className="text-sm" />
      </button>

      <FiChevronRight className="text-base-content/50" />

      {/* パス階層 */}
      {currentPath.map((pathSegment, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => {
              const newPath = currentPath.slice(0, index + 1)
              onNavigateToPath(newPath)
            }}
            className="btn btn-sm btn-ghost text-sm"
          >
            {pathSegment}
          </button>
          {index < currentPath.length - 1 && <FiChevronRight className="text-base-content/50" />}
        </React.Fragment>
      ))}

      {/* 戻るボタン */}
      <div className="ml-auto">
        <button
          onClick={onNavigateBack}
          className="btn btn-sm btn-ghost"
          title="一つ上のディレクトリに戻る"
        >
          <FiArrowLeft className="text-sm mr-1" />
          戻る
        </button>
      </div>
    </div>
  )
}
