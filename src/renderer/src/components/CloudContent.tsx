/**
 * @fileoverview クラウドコンテンツ表示コンポーネント
 *
 * このコンポーネントは、クラウドデータの表示部分を担当し、
 * カードビューとツリービューの切り替えを提供します。
 *
 * 主な機能：
 * - カードビューの表示
 * - ツリービューの表示
 * - 空状態の表示
 * - ローディング状態の表示
 */

import { FiCloud, FiFolder } from "react-icons/fi"

import type { ViewMode } from "./CloudHeader"
import { CloudItemCard, DirectoryNodeCard } from "./CloudItemCard"
import CloudTreeNode from "./CloudTreeNode"
import type { CloudDirectoryNode } from "../../../utils/cloudUtils"
import type { CloudDataItem } from "@renderer/hooks/useCloudData"

/**
 * クラウドコンテンツのプロパティ
 */
type CloudContentProps = {
  /** ビューモード */
  viewMode: ViewMode
  /** ローディング状態 */
  loading: boolean
  /** クラウドデータ */
  cloudData: CloudDataItem[]
  /** ディレクトリツリー */
  directoryTree: CloudDirectoryNode[]
  /** 現在のパス */
  currentPath: string[]
  /** 現在のディレクトリノード */
  currentDirectoryNodes: CloudDirectoryNode[]
  /** 展開されたノード */
  expandedNodes: Set<string>
  /** ノード展開切り替えコールバック */
  onToggleExpand: (path: string) => void
  /** ノード選択コールバック */
  onSelectNode: (node: CloudDirectoryNode) => void
  /** 削除コールバック */
  onDelete: (item: CloudDataItem | CloudDirectoryNode) => void
  /** ディレクトリ移動コールバック */
  onNavigateToDirectory: (directoryName: string) => void
  /** 詳細表示コールバック */
  onViewDetails: (item: CloudDataItem) => void
}

/**
 * 空状態コンポーネント
 */
function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}): React.JSX.Element {
  return (
    <div className="text-center py-12">
      <Icon className="text-6xl text-base-content/30 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-base-content/70 mb-2">{title}</h3>
      <p className="text-base-content/50">{description}</p>
    </div>
  )
}

/**
 * クラウドコンテンツ表示コンポーネント
 *
 * @param props コンテンツのプロパティ
 * @returns JSX要素
 */
export function CloudContent({
  viewMode,
  loading,
  cloudData,
  directoryTree,
  currentPath,
  currentDirectoryNodes,
  expandedNodes,
  onToggleExpand,
  onSelectNode,
  onDelete,
  onNavigateToDirectory,
  onViewDetails
}: CloudContentProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (viewMode === "cards") {
    return (
      <div>
        {/* カード表示 */}
        {currentPath.length === 0 ? (
          // ルートレベル - CloudDataItemを表示
          cloudData.length === 0 ? (
            <EmptyState
              icon={FiCloud}
              title="クラウドデータがありません"
              description="ゲームのセーブデータをアップロードすると、ここに表示されます"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cloudData.map((item, index) => (
                <CloudItemCard
                  key={index}
                  item={item}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                  onNavigate={() => onNavigateToDirectory(item.remotePath)}
                />
              ))}
            </div>
          )
        ) : // サブディレクトリ - DirectoryNodeCardを表示
        currentDirectoryNodes.length === 0 ? (
          <EmptyState
            icon={FiFolder}
            title="このディレクトリは空です"
            description="ファイルやサブディレクトリがありません"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDirectoryNodes.map((node, index) => (
              <DirectoryNodeCard
                key={`${node.path}-${index}`}
                node={node}
                onNavigate={node.isDirectory ? () => onNavigateToDirectory(node.path) : undefined}
                onDelete={() => onDelete(node)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ツリービュー
  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-4">
      {directoryTree.length === 0 ? (
        <EmptyState
          icon={FiCloud}
          title="クラウドデータがありません"
          description="ゲームのセーブデータをアップロードすると、ここに表示されます"
        />
      ) : (
        <div className="space-y-1">
          {directoryTree.map((node, index) => (
            <div key={`${node.path}-${index}`} className="group">
              <CloudTreeNode
                node={node}
                level={0}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                onDelete={onDelete}
                onSelect={onSelectNode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
