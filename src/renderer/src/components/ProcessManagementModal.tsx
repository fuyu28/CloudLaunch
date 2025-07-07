/**
 * @fileoverview プロセス管理モーダルコンポーネント
 *
 * このコンポーネントは、特定のゲームに関連するプロセス情報を表示し、管理する機能を提供します。
 *
 * 主な機能：
 * - プロセス一覧の表示（名前、実行時間）
 * - プロセスの削除
 * - 連携先プロセスの変更
 * - モーダルの開閉制御
 *
 * @param isOpen - モーダルの開閉状態
 * @param onClose - モーダルを閉じる関数
 * @param gameId - 対象のゲームID
 * @param gameTitle - ゲームタイトル
 * @param onProcessUpdated - プロセス情報更新時のコールバック
 */

import { useCallback, useEffect, useState } from "react"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import ConfirmModal from "./ConfirmModal"

/**
 * プロセス情報の型定義
 */
interface ProcessInfo {
  /** プロセスID */
  id: string
  /** プロセス名 */
  name: string
  /** 実行時間（秒） */
  duration: number
  /** プレイ日時 */
  playedAt: Date
  /** 連携先として設定されているか */
  isLinked: boolean
}

/**
 * プロセス管理モーダルのProps
 */
interface ProcessManagementModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean
  /** モーダルを閉じる関数 */
  onClose: () => void
  /** 対象のゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** プロセス情報更新時のコールバック */
  onProcessUpdated?: () => void
}

/**
 * プロセス管理モーダルコンポーネント
 */
export default function ProcessManagementModal({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onProcessUpdated
}: ProcessManagementModalProps): React.JSX.Element {
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { formatSmart, formatDate } = useTimeFormat()
  const { showToast } = useToastHandler()

  /**
   * プロセス情報を取得
   */
  const fetchProcesses = useCallback(async () => {
    if (!gameId) return

    setLoading(true)
    try {
      const result = await window.api.processMonitor.getGameProcesses(gameId)
      if (result.success && result.data) {
        setProcesses(result.data)
      } else {
        showToast(
          ("message" in result ? result.message : null) || "プロセス情報の取得に失敗しました",
          "error"
        )
      }
    } catch (error) {
      console.error("プロセス情報取得エラー:", error)
      showToast("プロセス情報の取得に失敗しました", "error")
    } finally {
      setLoading(false)
    }
  }, [gameId, showToast])

  /**
   * プロセス削除処理
   */
  const handleDeleteProcess = useCallback(async () => {
    if (!selectedProcessId) return

    try {
      const result = await window.api.processMonitor.deleteProcess(selectedProcessId)
      if (result.success) {
        showToast("プロセスを削除しました", "success")
        await fetchProcesses()
        onProcessUpdated?.()
      } else {
        showToast(
          ("message" in result ? result.message : null) || "プロセスの削除に失敗しました",
          "error"
        )
      }
    } catch (error) {
      console.error("プロセス削除エラー:", error)
      showToast("プロセスの削除に失敗しました", "error")
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedProcessId(null)
    }
  }, [selectedProcessId, fetchProcesses, onProcessUpdated, showToast])

  /**
   * 連携先プロセスの変更
   */
  const handleChangeLinkedProcess = useCallback(
    async (processId: string) => {
      try {
        const result = await window.api.processMonitor.setLinkedProcess(gameId, processId)
        if (result.success) {
          showToast("連携先プロセスを変更しました", "success")
          await fetchProcesses()
          onProcessUpdated?.()
        } else {
          showToast(
            ("message" in result ? result.message : null) || "連携先プロセスの変更に失敗しました",
            "error"
          )
        }
      } catch (error) {
        console.error("連携先プロセス変更エラー:", error)
        showToast("連携先プロセスの変更に失敗しました", "error")
      }
    },
    [gameId, fetchProcesses, onProcessUpdated, showToast]
  )

  /**
   * 削除確認モーダルを開く
   */
  const openDeleteModal = useCallback((processId: string) => {
    setSelectedProcessId(processId)
    setIsDeleteModalOpen(true)
  }, [])

  /**
   * 削除確認モーダルを閉じる
   */
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setSelectedProcessId(null)
  }, [])

  /**
   * モーダルが開かれたときにプロセス情報を取得
   */
  useEffect(() => {
    if (isOpen) {
      fetchProcesses()
    }
  }, [isOpen, fetchProcesses])

  /**
   * 選択されたプロセスの情報を取得
   */
  const selectedProcess = processes.find((p) => p.id === selectedProcessId)

  return (
    <>
      {/* プロセス管理モーダル */}
      <div className={`modal ${isOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">プロセス管理 - {gameTitle}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : (
            <div className="space-y-4">
              {processes.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  このゲームに関連するプロセスがありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>プロセス名</th>
                        <th>実行時間</th>
                        <th>プレイ日時</th>
                        <th>連携状態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map((process) => (
                        <tr key={process.id}>
                          <td>
                            <div className="font-medium">{process.name}</div>
                          </td>
                          <td>{formatSmart(process.duration)}</td>
                          <td>{formatDate(process.playedAt)}</td>
                          <td>
                            {process.isLinked ? (
                              <span className="badge badge-primary">連携中</span>
                            ) : (
                              <span className="badge badge-ghost">未連携</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {!process.isLinked && (
                                <button
                                  className="btn btn-sm btn-outline btn-primary"
                                  onClick={() => handleChangeLinkedProcess(process.id)}
                                >
                                  連携設定
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => openDeleteModal(process.id)}
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="modal-action">
            <button className="btn" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        id="delete-process-modal"
        isOpen={isDeleteModalOpen}
        message={`プロセス「${selectedProcess?.name}」を削除しますか？\nこの操作は取り消せません。`}
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={handleDeleteProcess}
        onCancel={closeDeleteModal}
      />
    </>
  )
}
