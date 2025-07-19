/**
 * @fileoverview クラウドデータ管理ページ
 *
 * このコンポーネントは、R2/S3クラウドストレージ上のデータを
 * エクスプローラー形式で閲覧・管理する機能を提供します。
 *
 * 主な機能：
 * - クラウドデータ一覧表示（フォルダビュー）
 * - ゲーム/フォルダの詳細情報表示
 * - データ削除機能（確認ダイアログ付き）
 * - ファイルサイズの人間が読みやすい形式での表示
 * - 最終更新日時の表示
 *
 * UI特徴：
 * - エクスプローラー風のカードレイアウト
 * - アイコンによる視覚的な分かりやすさ
 * - レスポンシブデザイン
 * - ローディング状態の表示
 */

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  FiFolder,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiFile,
  FiCloud,
  FiChevronRight,
  FiChevronDown,
  FiFolderPlus,
  FiHome,
  FiArrowLeft
} from "react-icons/fi"
import { toast } from "react-hot-toast"
import ConfirmModal from "@renderer/components/ConfirmModal"
import type { ConfirmDetails, WarningItem } from "@renderer/components/ConfirmModal"
/**
 * クラウドデータアイテムの型定義
 */
interface CloudDataItem {
  name: string
  totalSize: number
  fileCount: number
  lastModified: Date
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
interface CloudFileDetail {
  name: string
  size: number
  lastModified: Date
  key: string
  relativePath: string
}

/**
 * ディレクトリツリーノードの型定義
 */
interface CloudDirectoryNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  lastModified: Date
  children?: CloudDirectoryNode[]
  objectKey?: string
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param bytes バイト数
 * @returns 読みやすい形式の文字列
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * 日時を読みやすい形式に変換
 * @param date 日時
 * @returns 読みやすい形式の文字列
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date))
}

/**
 * ディレクトリノードから再帰的にファイル数を計算
 * @param node ディレクトリノード
 * @returns ファイル数
 */
function countFilesRecursively(node: CloudDirectoryNode): number {
  if (!node.isDirectory) {
    return 1
  }

  let fileCount = 0
  if (node.children) {
    node.children.forEach((child) => {
      fileCount += countFilesRecursively(child)
    })
  }
  return fileCount
}

/**
 * ツリーノードコンポーネントのプロパティ
 */
interface TreeNodeProps {
  node: CloudDirectoryNode
  level: number
  expandedNodes: Set<string>
  onToggleExpand: (path: string) => void
  onDelete: (node: CloudDirectoryNode) => void
  onSelect: (node: CloudDirectoryNode) => void
}

/**
 * ツリーノードコンポーネント
 */
function TreeNode({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  onDelete,
  onSelect
}: TreeNodeProps): React.JSX.Element {
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

          {/* 削除ボタン（ディレクトリとファイル両方に表示） */}
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
            <TreeNode
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

/**
 * クラウドデータアイテムコンポーネント
 */
interface CloudDataCardProps {
  item: CloudDataItem
  onDelete: (item: CloudDataItem) => void
  onViewDetails: (item: CloudDataItem) => void
  onNavigate?: (directoryName: string) => void
}

function CloudDataCard({
  item,
  onDelete,
  onViewDetails,
  onNavigate
}: CloudDataCardProps): React.JSX.Element {
  const handleClick = (): void => {
    if (onNavigate) {
      onNavigate(item.name)
    }
  }

  return (
    <div
      className={`bg-base-100 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-base-300 ${
        onNavigate ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FiFolder className="text-2xl text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base-content truncate" title={item.name}>
              {item.name}
            </h3>
            <div className="text-sm text-base-content/70 space-y-1">
              <div className="flex items-center gap-2">
                <FiFile className="text-xs" />
                <span>{item.fileCount} ファイル</span>
              </div>
              <div>{formatFileSize(item.totalSize)}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(item)
            }}
            className="btn btn-sm btn-ghost tooltip"
            data-tip="詳細表示"
          >
            <FiFile className="text-base" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            className="btn btn-sm btn-error btn-ghost tooltip"
            data-tip="削除"
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>
      </div>

      <div className="text-xs text-base-content/60">最終更新: {formatDate(item.lastModified)}</div>
    </div>
  )
}

/**
 * ディレクトリノードカードコンポーネント
 */
interface DirectoryNodeCardProps {
  node: CloudDirectoryNode
  onNavigate?: (directoryName: string) => void
  onDelete: (node: CloudDirectoryNode) => void
}

function DirectoryNodeCard({
  node,
  onNavigate,
  onDelete
}: DirectoryNodeCardProps): React.JSX.Element {
  const handleClick = (): void => {
    if (node.isDirectory && onNavigate) {
      onNavigate(node.name)
    }
  }

  return (
    <div
      className={`bg-base-100 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-base-300 ${
        node.isDirectory && onNavigate ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {node.isDirectory ? (
            <FiFolder className="text-2xl text-primary flex-shrink-0" />
          ) : (
            <FiFile className="text-2xl text-base-content/60 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base-content truncate" title={node.name}>
              {node.name}
            </h3>
            <div className="text-sm text-base-content/70 space-y-1">
              {node.isDirectory && (
                <div className="flex items-center gap-2">
                  <FiFile className="text-xs" />
                  <span>{countFilesRecursively(node)} ファイル</span>
                </div>
              )}
              <div>{formatFileSize(node.size)}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node)
            }}
            className="btn btn-sm btn-error btn-ghost tooltip"
            data-tip={node.isDirectory ? "ディレクトリ削除" : "ファイル削除"}
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>
      </div>

      <div className="text-xs text-base-content/60">最終更新: {formatDate(node.lastModified)}</div>
    </div>
  )
}

/**
 * ファイル詳細表示コンポーネント
 */
interface FileDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  item: CloudDataItem | null
  files: CloudFileDetail[]
  loading: boolean
}

function FileDetailsModal({
  isOpen,
  onClose,
  item,
  files,
  loading
}: FileDetailsModalProps): React.JSX.Element {
  if (!isOpen || !item) {
    return <></>
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FiFolder className="text-primary" />
          {item.name} の詳細
        </h3>

        <div className="mb-4 bg-base-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">ファイル数:</span> {item.fileCount}
            </div>
            <div>
              <span className="font-medium">総サイズ:</span> {formatFileSize(item.totalSize)}
            </div>
            <div className="col-span-2">
              <span className="font-medium">最終更新:</span> {formatDate(item.lastModified)}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-base-100 rounded border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FiFile className="text-base-content/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" title={file.relativePath}>
                        {file.relativePath}
                      </div>
                      <div className="text-sm text-base-content/70">
                        {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * クラウドデータ管理ページメインコンポーネント
 */
export default function Cloud(): React.JSX.Element {
  const [viewMode, setViewMode] = useState<"cards" | "tree">("cards")
  const [cloudData, setCloudData] = useState<CloudDataItem[]>([])
  const [directoryTree, setDirectoryTree] = useState<CloudDirectoryNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  // カードビューでの現在のパス管理
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [currentDirectoryNodes, setCurrentDirectoryNodes] = useState<CloudDirectoryNode[]>([])
  // カードビューナビゲーションキャッシュ
  const navigationCacheRef = useRef<Map<string, CloudDirectoryNode[]>>(new Map())
  const [deleteConfirm, setDeleteConfirm] = useState<CloudDataItem | CloudDirectoryNode | null>(
    null
  )
  const [detailsModal, setDetailsModal] = useState<{
    item: CloudDataItem | null
    files: CloudFileDetail[]
    loading: boolean
  }>({
    item: null,
    files: [],
    loading: false
  })

  /**
   * 指定したパスの子ディレクトリ・ファイルを取得（キャッシュ無し・直接計算）
   */
  const getNodesByPathDirect = (
    tree: CloudDirectoryNode[],
    path: string[]
  ): CloudDirectoryNode[] => {
    if (path.length === 0) {
      return tree
    }

    let currentNodes = tree
    for (const pathSegment of path) {
      const targetNode = currentNodes.find((node) => node.name === pathSegment && node.isDirectory)
      if (!targetNode || !targetNode.children) {
        return []
      }
      currentNodes = targetNode.children
    }
    return currentNodes
  }

  /**
   * 指定したパスの子ディレクトリ・ファイルを取得（キャッシュ対応）
   */
  const getNodesByPath = (tree: CloudDirectoryNode[], path: string[]): CloudDirectoryNode[] => {
    // キャッシュキーを生成
    const cacheKey = path.join("/") || "root"

    // キャッシュから取得を試行
    const cachedNodes = navigationCacheRef.current.get(cacheKey)
    if (cachedNodes) {
      return cachedNodes
    }

    // キャッシュにない場合は直接計算
    const resultNodes = getNodesByPathDirect(tree, path)

    // 結果をキャッシュに保存
    navigationCacheRef.current.set(cacheKey, resultNodes)

    return resultNodes
  }

  /**
   * ナビゲーションキャッシュをクリア
   */
  const clearNavigationCache = (): void => {
    navigationCacheRef.current.clear()
  }

  /**
   * クラウドデータ一覧を取得
   */
  const fetchCloudData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      // カードビュー用のデータを取得
      const cardResult = await window.api.cloudData.listCloudData()
      if (cardResult.success && cardResult.data) {
        clearNavigationCache()
        setCloudData(cardResult.data)
      } else {
        toast.error("クラウドデータの取得に失敗しました")
        setCloudData([])
      }

      // ツリービュー用のデータを取得
      const treeResult = await window.api.cloudData.getDirectoryTree()
      if (treeResult.success && treeResult.data) {
        setDirectoryTree(treeResult.data)
        // データが更新された場合はキャッシュをクリア
        navigationCacheRef.current.clear()
        // データ取得時は常にルートレベルに戻る
        setCurrentPath([])
        setCurrentDirectoryNodes([])
      } else {
        console.warn("ディレクトリツリーの取得に失敗しました")
        setDirectoryTree([])
        setCurrentDirectoryNodes([])
      }
    } catch (error) {
      console.error("クラウドデータ取得エラー:", error)
      toast.error("クラウドデータの取得に失敗しました")
      setCloudData([])
      setDirectoryTree([])
      setCurrentDirectoryNodes([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * ツリーノードの展開・折りたたみ
   */
  const handleToggleExpand = (path: string): void => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }

  /**
   * カードビューでディレクトリに移動（キャッシュ対応）
   */
  const handleNavigateToDirectory = (directoryName: string): void => {
    const newPath = [...currentPath, directoryName]
    setCurrentPath(newPath)

    // ディレクトリツリーが存在する場合のみナビゲーション
    if (directoryTree.length > 0) {
      const nodes = getNodesByPath(directoryTree, newPath)
      setCurrentDirectoryNodes(nodes)
    }
  }

  /**
   * カードビューで親ディレクトリに戻る（キャッシュ対応）
   */
  const handleNavigateBack = (): void => {
    const newPath = currentPath.slice(0, -1)
    setCurrentPath(newPath)

    // ディレクトリツリーが存在する場合のみナビゲーション
    if (directoryTree.length > 0) {
      const nodes = getNodesByPath(directoryTree, newPath)
      setCurrentDirectoryNodes(nodes)
    }
  }

  /**
   * 指定パスに直接移動（キャッシュ対応）
   */
  const handleNavigateToPath = (newPath: string[]): void => {
    setCurrentPath(newPath)

    // ディレクトリツリーが存在する場合のみナビゲーション
    if (directoryTree.length > 0) {
      const nodes = getNodesByPath(directoryTree, newPath)
      setCurrentDirectoryNodes(nodes)
    }
  }

  /**
   * ツリーノード選択
   */
  const handleSelectNode = (node: CloudDirectoryNode): void => {
    if (!node.isDirectory) {
      // ファイルが選択された場合の処理（必要に応じて実装）
      console.log("ファイルが選択されました:", node.name)
    } else {
      // ディレクトリが選択された場合は展開・折りたたみ
      handleToggleExpand(node.path)
    }
  }

  /**
   * ツリーノード削除
   */
  const handleDeleteNode = (node: CloudDirectoryNode): void => {
    setDeleteConfirm(node)
  }

  /**
   * クラウドデータを削除
   */
  const handleDelete = async (item: CloudDataItem | CloudDirectoryNode): Promise<void> => {
    try {
      // 全削除の場合
      if ("path" in item && item.path === "*") {
        // 全てのルートレベルディレクトリを削除
        const deletePromises = cloudData.map(async (cloudItem) => {
          return window.api.cloudData.deleteCloudData(cloudItem.remotePath)
        })

        const results = await Promise.all(deletePromises)
        const failedCount = results.filter((result) => !result.success).length

        if (failedCount === 0) {
          toast.success("全てのクラウドデータを削除しました")
        } else if (failedCount < results.length) {
          toast.success(`一部のデータを削除しました（失敗: ${failedCount}件）`)
        } else {
          toast.error("削除に失敗しました")
        }
      } else {
        // 個別削除の場合
        if ("path" in item && !item.isDirectory && item.objectKey) {
          // ファイルの個別削除
          const result = await window.api.cloudData.deleteFile(item.objectKey)
          if (result.success) {
            toast.success(`${item.name} ファイルを削除しました`)
          } else {
            toast.error("ファイルの削除に失敗しました")
          }
        } else {
          // ディレクトリの削除
          const deletePath = "remotePath" in item ? item.remotePath : item.path
          const result = await window.api.cloudData.deleteCloudData(deletePath)
          if (result.success) {
            toast.success(`${item.name} を削除しました`)
          } else {
            toast.error("削除に失敗しました")
          }
        }
      }

      // 削除後はキャッシュをクリアして最新データを取得
      navigationCacheRef.current.clear()
      fetchCloudData() // 一覧を再取得
    } catch (error) {
      console.error("削除エラー:", error)
      toast.error("削除に失敗しました")
    } finally {
      setDeleteConfirm(null)
    }
  }

  /**
   * ファイル詳細を表示
   */
  const handleViewDetails = async (item: CloudDataItem): Promise<void> => {
    setDetailsModal({ item, files: [], loading: true })

    try {
      const result = await window.api.cloudData.getCloudFileDetails(item.remotePath)
      if (result.success && result.data) {
        setDetailsModal((prev) => ({
          ...prev,
          files: result.data!,
          loading: false
        }))
      } else {
        toast.error("ファイル詳細の取得に失敗しました")
        setDetailsModal((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error("ファイル詳細取得エラー:", error)
      toast.error("ファイル詳細の取得に失敗しました")
      setDetailsModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchCloudData()
  }, [fetchCloudData])

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
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
              onClick={() => setViewMode("cards")}
            >
              <FiFolder className="mr-1" />
              カード
            </button>
            <button
              className={`btn join-item btn-sm ${viewMode === "tree" ? "btn-active" : ""}`}
              onClick={() => setViewMode("tree")}
            >
              <FiFolderPlus className="mr-1" />
              ツリー
            </button>
          </div>

          {/* 全削除ボタン */}
          {(cloudData.length > 0 || directoryTree.length > 0) && (
            <button
              onClick={() => {
                // 全削除用の特別なオブジェクトを作成
                const allDeleteItem = {
                  name: "全てのクラウドデータ",
                  path: "*",
                  isDirectory: true,
                  size: cloudData.reduce((sum, item) => sum + item.totalSize, 0),
                  lastModified: new Date(),
                  children: []
                } as CloudDirectoryNode
                setDeleteConfirm(allDeleteItem)
              }}
              className="btn btn-error btn-sm gap-2"
              disabled={loading}
            >
              <FiTrash2 />
              全て削除
            </button>
          )}

          <button onClick={fetchCloudData} disabled={loading} className="btn btn-primary gap-2">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            更新
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : viewMode === "cards" ? (
        <div>
          {/* パンくずリスト */}
          {currentPath.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-base-200 rounded-lg">
              <button
                onClick={() => handleNavigateToPath([])}
                className="btn btn-sm btn-ghost"
                title="ルートに戻る"
              >
                <FiHome className="text-sm" />
              </button>
              <FiChevronRight className="text-base-content/50" />
              {currentPath.map((pathSegment, index) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => {
                      const newPath = currentPath.slice(0, index + 1)
                      handleNavigateToPath(newPath)
                    }}
                    className="btn btn-sm btn-ghost text-sm"
                  >
                    {pathSegment}
                  </button>
                  {index < currentPath.length - 1 && (
                    <FiChevronRight className="text-base-content/50" />
                  )}
                </React.Fragment>
              ))}
              <div className="ml-auto">
                <button
                  onClick={handleNavigateBack}
                  className="btn btn-sm btn-ghost"
                  title="一つ上のディレクトリに戻る"
                >
                  <FiArrowLeft className="text-sm mr-1" />
                  戻る
                </button>
              </div>
            </div>
          )}

          {/* カード表示 */}
          {currentPath.length === 0 ? (
            // ルートレベル - 従来のCloudDataItemを表示
            cloudData.length === 0 ? (
              <div className="text-center py-12">
                <FiCloud className="text-6xl text-base-content/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-base-content/70 mb-2">
                  クラウドデータがありません
                </h3>
                <p className="text-base-content/50">
                  ゲームのセーブデータをアップロードすると、ここに表示されます
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cloudData.map((item, index) => (
                  <CloudDataCard
                    key={index}
                    item={item}
                    onDelete={setDeleteConfirm}
                    onViewDetails={handleViewDetails}
                    onNavigate={handleNavigateToDirectory}
                  />
                ))}
              </div>
            )
          ) : // サブディレクトリ - DirectoryNodeCardを表示
          currentDirectoryNodes.length === 0 ? (
            <div className="text-center py-12">
              <FiFolder className="text-6xl text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-base-content/70 mb-2">
                このディレクトリは空です
              </h3>
              <p className="text-base-content/50">ファイルやサブディレクトリがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDirectoryNodes.map((node, index) => (
                <DirectoryNodeCard
                  key={`${node.path}-${index}`}
                  node={node}
                  onNavigate={node.isDirectory ? handleNavigateToDirectory : undefined}
                  onDelete={handleDeleteNode}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // ツリービュー
        <div className="bg-base-100 rounded-lg border border-base-300 p-4">
          {directoryTree.length === 0 ? (
            <div className="text-center py-12">
              <FiCloud className="text-6xl text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-base-content/70 mb-2">
                クラウドデータがありません
              </h3>
              <p className="text-base-content/50">
                ゲームのセーブデータをアップロードすると、ここに表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {directoryTree.map((node, index) => (
                <div key={`${node.path}-${index}`} className="group">
                  <TreeNode
                    node={node}
                    level={0}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    onDelete={handleDeleteNode}
                    onSelect={handleSelectNode}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmModal
        id="delete-cloud-data-modal"
        isOpen={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="クラウドデータの削除"
        message={`${deleteConfirm?.name}${"path" in (deleteConfirm || {}) ? ((deleteConfirm as CloudDirectoryNode).isDirectory ? "以下のディレクトリ・ファイルを" : "ファイルを") : "のクラウドデータを"}完全に削除しますか？`}
        confirmText="削除"
        cancelText="キャンセル"
        confirmVariant="error"
        details={
          {
            icon: <FiAlertTriangle className="text-error" />,
            subText:
              "path" in (deleteConfirm || {})
                ? `パス: ${(deleteConfirm as CloudDirectoryNode)?.path}${!(deleteConfirm as CloudDirectoryNode)?.isDirectory ? " (ファイル)" : ""}`
                : undefined,
            warnings: [
              { text: "削除されたデータは復元できません" },
              {
                text:
                  "fileCount" in (deleteConfirm || {})
                    ? `${(deleteConfirm as CloudDataItem)?.fileCount} 個のファイルが削除されます`
                    : deleteConfirm &&
                        "path" in deleteConfirm &&
                        (deleteConfirm as CloudDirectoryNode).path === "*"
                      ? `全ての ${cloudData.reduce((sum, item) => sum + item.fileCount, 0)} 個のファイルが削除されます`
                      : deleteConfirm &&
                          "path" in deleteConfirm &&
                          !(deleteConfirm as CloudDirectoryNode).isDirectory
                        ? "1 個のファイルが削除されます"
                        : `${deleteConfirm && "path" in deleteConfirm ? countFilesRecursively(deleteConfirm as CloudDirectoryNode) : 0} 個のファイルが削除されます`,
                highlight: true
              },
              {
                text: `総容量: ${deleteConfirm ? formatFileSize("totalSize" in deleteConfirm ? deleteConfirm.totalSize : deleteConfirm.size) : "0 B"}`
              },
              ...("path" in (deleteConfirm || {}) &&
              (deleteConfirm as CloudDirectoryNode)?.isDirectory
                ? [{ text: "サブディレクトリも含めて完全に削除されます" }]
                : [])
            ] as WarningItem[]
          } as ConfirmDetails
        }
      />

      {/* ファイル詳細モーダル */}
      <FileDetailsModal
        isOpen={!!detailsModal.item}
        onClose={() => setDetailsModal({ item: null, files: [], loading: false })}
        item={detailsModal.item}
        files={detailsModal.files}
        loading={detailsModal.loading}
      />
    </div>
  )
}
