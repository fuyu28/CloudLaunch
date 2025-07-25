/**
 * @fileoverview クラウドディレクトリツリーノードコンポーネント
 *
 * ツリービューでのディレクトリ・ファイル表示とインタラクション機能を提供します。
 */

import React from "react"
import { FiFolder, FiFile, FiTrash2, FiChevronRight, FiChevronDown } from "react-icons/fi"
import {
  CloudDirectoryNode,
  formatFileSize,
  formatDate,
  countFilesRecursively
} from "../../../utils/cloudUtils"

/**
 * ツリーノードコンポーネントのプロパティ
 */
interface CloudTreeNodeProps {
  node: CloudDirectoryNode
  level: number
  expandedNodes: Set<string>
  onToggleExpand: (path: string) => void
  onDelete: (node: CloudDirectoryNode) => void
  onSelect: (node: CloudDirectoryNode) => void
}

/**
 * クラウドディレクトリツリーノードコンポーネント
 */
export default function CloudTreeNode({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  onDelete,
  onSelect
}: CloudTreeNodeProps): React.JSX.Element {
  const isExpanded = expandedNodes.has(node.path)
  const hasChildren = node.children && node.children.length > 0

  return (
    <>
      <div
        className={`flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer rounded-md ${
          level > 0 ? "ml-" + level * 4 : ""
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {/* 展開/折りたたみボタン */}
        <button
          onClick={() => node.isDirectory && hasChildren && onToggleExpand(node.path)}
          className={`w-4 h-4 flex items-center justify-center ${
            !node.isDirectory || !hasChildren ? "invisible" : ""
          }`}
        >
          {hasChildren &&
            (isExpanded ? (
              <FiChevronDown className="text-xs" />
            ) : (
              <FiChevronRight className="text-xs" />
            ))}
        </button>

        {/* アイコン */}
        <div className="flex-shrink-0">
          {node.isDirectory ? (
            <FiFolder className="text-primary" />
          ) : (
            <FiFile className="text-base-content/60" />
          )}
        </div>

        {/* ファイル/フォルダ名 */}
        <div
          className="flex-1 min-w-0 flex items-center justify-between group"
          onClick={() => onSelect(node)}
        >
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-sm" title={node.name}>
              {node.name}
            </div>
            <div className="text-xs text-base-content/60">
              {formatFileSize(node.size)} • {formatDate(node.lastModified)}
              {node.isDirectory && (
                <span className="ml-2">({countFilesRecursively(node)} ファイル)</span>
              )}
            </div>
          </div>

          {/* 削除ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node)
            }}
            className="btn btn-sm btn-ghost btn-error opacity-0 group-hover:opacity-100 transition-opacity ml-2"
            title={node.isDirectory ? `${node.name} 以下を削除` : `${node.name} ファイルを削除`}
          >
            <FiTrash2 className="text-xs" />
          </button>
        </div>
      </div>

      {/* 子ノード */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <CloudTreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </>
  )
}
