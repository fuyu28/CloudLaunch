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
 * - ビュー切り替え（カード/ツリー）
 * - ナビゲーション機能
 */

import { useState, useEffect } from "react"

import { CloudBreadcrumb } from "@renderer/components/CloudBreadcrumb"
import { CloudContent } from "@renderer/components/CloudContent"
import { CloudDeleteModal } from "@renderer/components/CloudDeleteModal"
import { CloudFileDetailsModal } from "@renderer/components/CloudFileDetailsModal"
import { CloudHeader, type ViewMode } from "@renderer/components/CloudHeader"

import {
  useCloudData,
  type CloudDataItem,
  type CloudFileDetail
} from "@renderer/hooks/useCloudData"

import type { CloudDirectoryNode } from "../../../utils/cloudUtils"

/**
 * クラウドデータ管理ページメインコンポーネント
 */
export default function Cloud(): React.JSX.Element {
  // 状態管理
  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
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

  // クラウドデータ管理フック
  const {
    cloudData,
    directoryTree,
    loading,
    currentPath,
    currentDirectoryNodes,
    fetchCloudData,
    navigateToDirectory,
    navigateBack,
    navigateToPath,
    deleteCloudData
  } = useCloudData()

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
   * ツリーノード選択
   */
  const handleSelectNode = (node: CloudDirectoryNode): void => {
    if (!node.isDirectory) {
      console.log("ファイルが選択されました:", node.name)
    } else {
      handleToggleExpand(node.path)
    }
  }

  /**
   * 全削除処理
   */
  const handleDeleteAll = (): void => {
    const allDeleteItem = {
      name: "全てのクラウドデータ",
      path: "*",
      isDirectory: true,
      size: cloudData.reduce((sum, item) => sum + item.totalSize, 0),
      lastModified: new Date(),
      children: []
    } as CloudDirectoryNode
    setDeleteConfirm(allDeleteItem)
  }

  /**
   * クラウドデータを削除
   */
  const handleDelete = async (item: CloudDataItem | CloudDirectoryNode): Promise<void> => {
    try {
      await deleteCloudData(item)
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
        import("react-hot-toast").then(({ toast }) => {
          toast.error("ファイル詳細の取得に失敗しました")
        })
        setDetailsModal((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error("ファイル詳細取得エラー:", error)
      import("react-hot-toast").then(({ toast }) => {
        toast.error("ファイル詳細の取得に失敗しました")
      })
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
      <CloudHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        cloudData={cloudData}
        directoryTree={directoryTree}
        loading={loading}
        onRefresh={fetchCloudData}
        onDeleteAll={handleDeleteAll}
      />

      {/* パンくずリスト */}
      <CloudBreadcrumb
        currentPath={currentPath}
        onNavigateToPath={navigateToPath}
        onNavigateBack={navigateBack}
      />

      {/* コンテンツ */}
      <CloudContent
        viewMode={viewMode}
        loading={loading}
        cloudData={cloudData}
        directoryTree={directoryTree}
        currentPath={currentPath}
        currentDirectoryNodes={currentDirectoryNodes}
        expandedNodes={expandedNodes}
        onToggleExpand={handleToggleExpand}
        onSelectNode={handleSelectNode}
        onDelete={setDeleteConfirm}
        onNavigateToDirectory={navigateToDirectory}
        onViewDetails={handleViewDetails}
      />

      {/* 削除確認ダイアログ */}
      <CloudDeleteModal
        deleteConfirm={deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        cloudData={cloudData}
      />

      {/* ファイル詳細モーダル */}
      <CloudFileDetailsModal
        isOpen={!!detailsModal.item}
        onClose={() => setDetailsModal({ item: null, files: [], loading: false })}
        item={detailsModal.item}
        files={detailsModal.files}
        loading={detailsModal.loading}
      />
    </div>
  )
}
