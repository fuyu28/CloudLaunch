/**
 * @fileoverview クラウドデータ管理カスタムフック
 *
 * クラウドデータの取得、削除、ナビゲーション機能を提供します。
 */

import { useState, useCallback, useRef } from "react"
import { toast } from "react-hot-toast"
import { CloudDirectoryNode, getNodesByPath } from "../../../utils/cloudUtils"

/**
 * クラウドデータアイテムの型定義
 */
export interface CloudDataItem {
  name: string
  totalSize: number
  fileCount: number
  lastModified: Date
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
export interface CloudFileDetail {
  name: string
  size: number
  lastModified: Date
  key: string
  relativePath: string
}

/**
 * useCloudDataフックの戻り値の型定義
 */
export interface UseCloudDataReturn {
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
  const [cloudData, setCloudData] = useState<CloudDataItem[]>([])
  const [directoryTree, setDirectoryTree] = useState<CloudDirectoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [currentDirectoryNodes, setCurrentDirectoryNodes] = useState<CloudDirectoryNode[]>([])

  // ナビゲーションキャッシュ
  const navigationCacheRef = useRef<Map<string, CloudDirectoryNode[]>>(new Map())

  /**
   * ナビゲーションキャッシュをクリア
   */
  const clearNavigationCache = useCallback((): void => {
    navigationCacheRef.current.clear()
  }, [])

  /**
   * 指定したパスの子ディレクトリ・ファイルを取得（キャッシュ対応）
   */
  const getNodesByPathCached = useCallback(
    (tree: CloudDirectoryNode[], path: string[]): CloudDirectoryNode[] => {
      const cacheKey = path.join("/") || "root"
      const cachedNodes = navigationCacheRef.current.get(cacheKey)
      if (cachedNodes) {
        return cachedNodes
      }

      const resultNodes = getNodesByPath(tree, path)
      navigationCacheRef.current.set(cacheKey, resultNodes)
      return resultNodes
    },
    []
  )

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
        navigationCacheRef.current.clear()
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
  }, [clearNavigationCache])

  /**
   * カードビューでディレクトリに移動
   */
  const navigateToDirectory = useCallback(
    (directoryName: string): void => {
      const newPath = [...currentPath, directoryName]
      setCurrentPath(newPath)

      if (directoryTree.length > 0) {
        const nodes = getNodesByPathCached(directoryTree, newPath)
        setCurrentDirectoryNodes(nodes)
      }
    },
    [currentPath, directoryTree, getNodesByPathCached]
  )

  /**
   * カードビューで親ディレクトリに戻る
   */
  const navigateBack = useCallback((): void => {
    const newPath = currentPath.slice(0, -1)
    setCurrentPath(newPath)

    if (directoryTree.length > 0) {
      const nodes = getNodesByPathCached(directoryTree, newPath)
      setCurrentDirectoryNodes(nodes)
    }
  }, [currentPath, directoryTree, getNodesByPathCached])

  /**
   * 指定パスに直接移動
   */
  const navigateToPath = useCallback(
    (newPath: string[]): void => {
      setCurrentPath(newPath)

      if (directoryTree.length > 0) {
        const nodes = getNodesByPathCached(directoryTree, newPath)
        setCurrentDirectoryNodes(nodes)
      }
    },
    [directoryTree, getNodesByPathCached]
  )

  /**
   * クラウドデータを削除
   */
  const deleteCloudData = useCallback(
    async (item: CloudDataItem | CloudDirectoryNode): Promise<void> => {
      try {
        // 全削除の場合
        if ("path" in item && item.path === "*") {
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
        fetchCloudData()
      } catch (error) {
        console.error("削除エラー:", error)
        toast.error("削除に失敗しました")
      }
    },
    [cloudData, fetchCloudData]
  )

  return {
    // State
    cloudData,
    directoryTree,
    loading,
    currentPath,
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
