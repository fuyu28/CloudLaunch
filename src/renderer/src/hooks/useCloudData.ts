/**
 * @fileoverview クラウドデータ管理カスタムフック
 *
 * クラウドデータの取得、削除、ナビゲーション機能を提供します。
 */

import { useState, useCallback, useRef, useMemo } from "react"
import { toast } from "react-hot-toast"

import type { CloudDirectoryNode } from "../../../utils/cloudUtils"
import { getNodesByPath } from "../../../utils/cloudUtils"

// CloudDirectoryNodeを再エクスポート
export type { CloudDirectoryNode } from "../../../utils/cloudUtils"

/**
 * クラウドデータアイテムの型定義
 */
export type CloudDataItem = {
  name: string
  totalSize: number
  fileCount: number
  lastModified: Date
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
export type CloudFileDetail = {
  name: string
  size: number
  lastModified: Date
  key: string
  relativePath: string
}

/**
 * useCloudDataフックの戻り値の型定義
 */
export type UseCloudDataReturn = {
  // State
  cloudData: CloudDataItem[]
  directoryTree: CloudDirectoryNode[]
  loading: boolean
  currentPath: string[]
  currentDirectoryNodes: CloudDirectoryNode[]

  // Actions
  fetchCloudData: () => Promise<void>
  navigateToDirectory: (directoryName: string) => void
  navigateBack: () => void
  navigateToPath: (newPath: string[]) => void
  deleteCloudData: (item: CloudDataItem | CloudDirectoryNode) => Promise<void>
  clearNavigationCache: () => void
}

/**
 * クラウドデータ管理フック
 */
export function useCloudData(): UseCloudDataReturn {
  // 状態を統合管理
  const [state, setState] = useState({
    cloudData: [] as CloudDataItem[],
    directoryTree: [] as CloudDirectoryNode[],
    loading: true,
    currentPath: [] as string[]
  })

  // ナビゲーションキャッシュ
  const navigationCacheRef = useRef<Map<string, CloudDirectoryNode[]>>(new Map())

  // 現在のディレクトリノードをメモ化
  const currentDirectoryNodes = useMemo(() => {
    if (state.directoryTree.length === 0) return []
    return getNodesByPath(state.directoryTree, state.currentPath)
  }, [state.directoryTree, state.currentPath])

  /**
   * ナビゲーションキャッシュをクリア
   */
  const clearNavigationCache = useCallback((): void => {
    navigationCacheRef.current.clear()
  }, [])

  /**
   * クラウドデータ一覧を取得
   */
  const fetchCloudData = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      // 並列でデータを取得
      const [cardResult, treeResult] = await Promise.all([
        window.api.cloudData.listCloudData(),
        window.api.cloudData.getDirectoryTree()
      ])

      // カードビュー用のデータ処理
      const cloudData = cardResult.success && cardResult.data ? cardResult.data : []
      if (!cardResult.success) {
        toast.error("クラウドデータの取得に失敗しました")
      }

      // ツリービュー用のデータ処理
      const directoryTree = treeResult.success && treeResult.data ? treeResult.data : []
      if (!treeResult.success) {
        console.warn("ディレクトリツリーの取得に失敗しました")
      }

      // キャッシュクリアと状態更新
      clearNavigationCache()
      setState({
        cloudData,
        directoryTree,
        loading: false,
        currentPath: []
      })
    } catch (error) {
      console.error("クラウドデータ取得エラー:", error)
      toast.error("クラウドデータの取得に失敗しました")
      setState({
        cloudData: [],
        directoryTree: [],
        loading: false,
        currentPath: []
      })
    }
  }, [clearNavigationCache])

  /**
   * カードビューでディレクトリに移動
   */
  const navigateToDirectory = useCallback(
    (directoryName: string): void => {
      const newPath = [...state.currentPath, directoryName]
      setState((prev) => ({ ...prev, currentPath: newPath }))
    },
    [state.currentPath]
  )

  /**
   * カードビューで親ディレクトリに戻る
   */
  const navigateBack = useCallback((): void => {
    const newPath = state.currentPath.slice(0, -1)
    setState((prev) => ({ ...prev, currentPath: newPath }))
  }, [state.currentPath])

  /**
   * 指定パスに直接移動
   */
  const navigateToPath = useCallback((newPath: string[]): void => {
    setState((prev) => ({ ...prev, currentPath: newPath }))
  }, [])

  /**
   * クラウドデータを削除
   */
  const deleteCloudData = useCallback(
    async (item: CloudDataItem | CloudDirectoryNode): Promise<void> => {
      try {
        // 全削除の場合
        if ("path" in item && item.path === "*") {
          const deletePromises = state.cloudData.map(async (cloudItem) => {
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
        fetchCloudData()
      } catch (error) {
        console.error("削除エラー:", error)
        toast.error("削除に失敗しました")
      }
    },
    [state.cloudData, fetchCloudData]
  )

  return {
    // State
    cloudData: state.cloudData,
    directoryTree: state.directoryTree,
    loading: state.loading,
    currentPath: state.currentPath,
    currentDirectoryNodes,

    // Actions
    fetchCloudData,
    navigateToDirectory,
    navigateBack,
    navigateToPath,
    deleteCloudData,
    clearNavigationCache
  }
}
