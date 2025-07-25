/**
 * @fileoverview クラウドファイル詳細表示モーダルコンポーネント
 *
 * このコンポーネントは、クラウドストレージ上のファイル詳細情報を
 * モーダル形式で表示する機能を提供します。
 *
 * 主な機能：
 * - ファイル一覧の表示
 * - ファイルサイズの表示
 * - 最終更新日時の表示
 * - ローディング状態の管理
 */

import React from "react"
import { FiFolder, FiFile } from "react-icons/fi"
import type { CloudDataItem, CloudFileDetail } from "@renderer/hooks/useCloudData"
import { formatFileSize, formatDate } from "../../../utils/cloudUtils"

/**
 * ファイル詳細モーダルのプロパティ
 */
interface CloudFileDetailsModalProps {
  /** モーダルが開いているかどうか */
  isOpen: boolean
  /** モーダルを閉じるコールバック */
  onClose: () => void
  /** 表示対象のアイテム */
  item: CloudDataItem | null
  /** ファイル詳細一覧 */
  files: CloudFileDetail[]
  /** ローディング状態 */
  loading: boolean
}

/**
 * クラウドファイル詳細表示モーダル
 *
 * @param props モーダルのプロパティ
 * @returns JSX要素
 */
export function CloudFileDetailsModal({
  isOpen,
  onClose,
  item,
  files,
  loading
}: CloudFileDetailsModalProps): React.JSX.Element {
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
