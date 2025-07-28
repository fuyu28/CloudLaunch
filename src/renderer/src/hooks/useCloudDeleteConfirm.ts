/**
 * @fileoverview クラウドデータ削除確認ロジック
 *
 * このフックは、クラウドデータの削除確認に関するロジックを
 * カプセル化し、再利用可能な形で提供します。
 *
 * 主な機能：
 * - 削除確認メッセージの生成
 * - ファイル数メッセージの生成
 * - サブテキストの生成
 * - 容量メッセージの生成
 * - 追加警告の生成
 */

import { useMemo } from "react"

import type { CloudDataItem } from "./useCloudData"
import type { CloudDirectoryNode } from "../../../utils/cloudUtils"
import { formatFileSize, countFilesRecursively } from "../../../utils/cloudUtils"
import type { WarningItem } from "@renderer/components/ConfirmModal"

/**
 * 削除確認ロジックのフック
 *
 * @param item 削除対象のアイテム
 * @param cloudData 全クラウドデータ（全削除時の計算用）
 * @returns 削除確認に必要な情報
 */
export function useCloudDeleteConfirm(
  item: CloudDataItem | CloudDirectoryNode | null,
  cloudData: CloudDataItem[]
): {
  deleteMessage: string
  fileCountMessage: string
  subText: string | undefined
  sizeMessage: string
  additionalWarnings: WarningItem[]
} {
  const deleteMessage = useMemo((): string => {
    if (!item) {
      return ""
    }

    const itemName = item.name

    // CloudDirectoryNode（ツリービューからの削除）の場合
    if ("path" in item) {
      const directoryNode = item as CloudDirectoryNode
      if (directoryNode.isDirectory) {
        return `${itemName}以下のディレクトリ・ファイルを完全に削除しますか？`
      } else {
        return `${itemName}ファイルを完全に削除しますか？`
      }
    }

    // CloudDataItem（カードビューからの削除）の場合
    return `${itemName}のクラウドデータを完全に削除しますか？`
  }, [item])

  const fileCountMessage = useMemo((): string => {
    if (!item) {
      return "0 個のファイルが削除されます"
    }

    // CloudDataItem（カードビューからの削除）の場合
    if ("fileCount" in item) {
      return `${item.fileCount} 個のファイルが削除されます`
    }

    // CloudDirectoryNode（ツリービューからの削除）の場合
    if ("path" in item) {
      const directoryNode = item as CloudDirectoryNode

      // 全削除の場合
      if (directoryNode.path === "*") {
        const totalFiles = cloudData.reduce((sum, cloudItem) => sum + cloudItem.fileCount, 0)
        return `全ての ${totalFiles} 個のファイルが削除されます`
      }

      // 単一ファイルの場合
      if (!directoryNode.isDirectory) {
        return "1 個のファイルが削除されます"
      }

      // ディレクトリの場合（再帰的にカウント）
      const fileCount = countFilesRecursively(directoryNode)
      return `${fileCount} 個のファイルが削除されます`
    }

    return "0 個のファイルが削除されます"
  }, [item, cloudData])

  const subText = useMemo((): string | undefined => {
    if (!item || !("path" in item)) {
      return undefined
    }

    const directoryNode = item as CloudDirectoryNode
    const pathInfo = directoryNode.path
    const fileLabel = !directoryNode.isDirectory ? " (ファイル)" : ""

    return `パス: ${pathInfo}${fileLabel}`
  }, [item])

  const sizeMessage = useMemo((): string => {
    if (!item) {
      return "総容量: 0 B"
    }

    let size: number
    if ("totalSize" in item) {
      size = item.totalSize
    } else {
      size = item.size
    }

    return `総容量: ${formatFileSize(size)}`
  }, [item])

  const additionalWarnings = useMemo((): WarningItem[] => {
    if (!item || !("path" in item)) {
      return []
    }

    const directoryNode = item as CloudDirectoryNode
    if (directoryNode.isDirectory) {
      return [{ text: "サブディレクトリも含めて完全に削除されます" }]
    }

    return []
  }, [item])

  return {
    deleteMessage,
    fileCountMessage,
    subText,
    sizeMessage,
    additionalWarnings
  }
}
