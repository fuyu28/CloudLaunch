/**
 * @fileoverview クラウドデータ削除確認モーダル
 *
 * このコンポーネントは、クラウドデータの削除確認ダイアログを
 * 表示し、削除に関する詳細情報を提供します。
 *
 * 主な機能：
 * - 削除確認メッセージの表示
 * - ファイル数、容量などの詳細情報表示
 * - 警告メッセージの表示
 * - 削除/キャンセルの操作
 */

import React from "react"
import { FiAlertTriangle } from "react-icons/fi"
import ConfirmModal from "./ConfirmModal"
import type { ConfirmDetails, WarningItem } from "./ConfirmModal"
import type { CloudDataItem } from "@renderer/hooks/useCloudData"
import type { CloudDirectoryNode } from "../../../utils/cloudUtils"
import { useCloudDeleteConfirm } from "@renderer/hooks/useCloudDeleteConfirm"

/**
 * 削除確認モーダルのプロパティ
 */
interface CloudDeleteModalProps {
  /** 削除対象のアイテム */
  deleteConfirm: CloudDataItem | CloudDirectoryNode | null
  /** キャンセルコールバック */
  onCancel: () => void
  /** 削除実行コールバック */
  onConfirm: (item: CloudDataItem | CloudDirectoryNode) => void
  /** 全クラウドデータ（全削除時の計算用） */
  cloudData: CloudDataItem[]
}

/**
 * クラウドデータ削除確認モーダル
 *
 * @param props モーダルのプロパティ
 * @returns JSX要素
 */
export function CloudDeleteModal({
  deleteConfirm,
  onCancel,
  onConfirm,
  cloudData
}: CloudDeleteModalProps): React.JSX.Element {
  const { deleteMessage, fileCountMessage, subText, sizeMessage, additionalWarnings } =
    useCloudDeleteConfirm(deleteConfirm, cloudData)

  return (
    <ConfirmModal
      id="delete-cloud-data-modal"
      isOpen={!!deleteConfirm}
      onCancel={onCancel}
      onConfirm={() => deleteConfirm && onConfirm(deleteConfirm)}
      title="クラウドデータの削除"
      message={deleteMessage}
      confirmText="削除"
      cancelText="キャンセル"
      confirmVariant="error"
      details={
        {
          icon: <FiAlertTriangle className="text-error" />,
          subText,
          warnings: [
            { text: "削除されたデータは復元できません" },
            {
              text: fileCountMessage,
              highlight: true
            },
            {
              text: sizeMessage
            },
            ...additionalWarnings
          ] as WarningItem[]
        } as ConfirmDetails
      }
    />
  )
}
