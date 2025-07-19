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

import React, { useState, useEffect } from "react"
import {
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiFile,
  FiCloud,
  FiChevronRight,
  FiFolder,
  FiFolderPlus,
  FiHome,
  FiArrowLeft
} from "react-icons/fi"
import ConfirmModal from "@renderer/components/ConfirmModal"
import type { ConfirmDetails, WarningItem } from "@renderer/components/ConfirmModal"
import {
  useCloudData,
  type CloudDataItem,
  type CloudFileDetail
} from "@renderer/hooks/useCloudData"
import {
  formatFileSize,
  formatDate,
  countFilesRecursively,
  type CloudDirectoryNode
} from "../../../utils/cloudUtils"
import { CloudItemCard, DirectoryNodeCard } from "@renderer/components/CloudItemCard"
import CloudTreeNode from "@renderer/components/CloudTreeNode"

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

  // useCloudDataフックを使用してクラウドデータ管理機能を取得
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
                onClick={() => navigateToPath([])}
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
                      navigateToPath(newPath)
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
                  onClick={navigateBack}
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
                  <CloudItemCard
                    key={index}
                    item={item}
                    onDelete={setDeleteConfirm}
                    onViewDetails={handleViewDetails}
                    onNavigate={navigateToDirectory}
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
                  onNavigate={node.isDirectory ? navigateToDirectory : undefined}
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
                  <CloudTreeNode
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
