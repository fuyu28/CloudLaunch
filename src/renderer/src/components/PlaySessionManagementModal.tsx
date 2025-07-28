/**
 * @fileoverview セッション管理モーダルコンポーネント
 *
 * このコンポーネントは、特定のゲームに関連するプレイセッション情報を表示し、管理する機能を提供します。
 *
 * 主な機能：
 * - セッション一覧の表示（名前、実行時間）
 * - セッションの削除
 * - セッションの編集（名前、章の紐づけ）
 * - モーダルの開閉制御
 *
 * @param isOpen - モーダルの開閉状態
 * @param onClose - モーダルを閉じる関数
 * @param gameId - 対象のゲームID
 * @param gameTitle - ゲームタイトル
 * @param onProcessUpdated - セッション情報更新時のコールバック
 */

import { useCallback, useEffect, useState, useMemo } from "react"
import { RxCross1 } from "react-icons/rx"
import { FaEdit } from "react-icons/fa"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { Chapter } from "../../../types/chapter"
import type { PlaySessionType } from "../../../types/game"
import ConfirmModal from "./ConfirmModal"
import { playSessionEditSchema } from "../../../schemas/playSession"
import { useZodValidation } from "../hooks/useZodValidation"

/**
 * 編集用のフォームデータ
 */
interface EditFormData extends Record<string, unknown> {
  sessionName: string
  chapterId: string | null
}

/**
 * 編集フォームのフィールド名の型
 */
type EditFormFields = keyof Pick<EditFormData, "sessionName" | "chapterId">

/**
 * セッション管理モーダルのProps
 */
interface PlaySessionManagementModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean
  /** モーダルを閉じる関数 */
  onClose: () => void
  /** 対象のゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** セッション情報更新時のコールバック */
  onProcessUpdated?: () => void
}

/**
 * セッション管理モーダルコンポーネント
 */
export default function PlaySessionManagementModal({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onProcessUpdated
}: PlaySessionManagementModalProps): React.JSX.Element {
  const [processes, setProcesses] = useState<PlaySessionType[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<PlaySessionType | undefined>(undefined)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    sessionName: "",
    chapterId: null
  })

  // フォームデータをuseMemoでラップ
  const memoizedEditFormData = useMemo(() => editFormData, [editFormData])

  // バリデーション
  const validation = useZodValidation(playSessionEditSchema, memoizedEditFormData)
  const { formatSmart, formatDateWithTime } = useTimeFormat()
  const { showToast } = useToastHandler()

  /**
   * セッション情報を取得
   */
  const fetchProcesses = useCallback(async () => {
    if (!gameId) return

    setLoading(true)
    try {
      const result = await window.api.database.getPlaySessions(gameId)
      if (result.success && result.data) {
        setProcesses(result.data)
      } else {
        showToast("セッション情報の取得に失敗しました", "error")
      }
    } catch (error) {
      console.error("セッション情報取得エラー:", error)
      showToast("セッション情報の取得に失敗しました", "error")
    } finally {
      setLoading(false)
    }
  }, [gameId, showToast])

  /**
   * 章情報を取得
   */
  const fetchChapters = useCallback(async () => {
    if (!gameId) return

    try {
      const result = await window.api.chapter.getChapters(gameId)
      if (result.success && result.data) {
        setChapters(result.data)
      } else {
        console.error("章情報の取得に失敗")
      }
    } catch (error) {
      console.error("章情報取得エラー:", error)
    }
  }, [gameId])

  /**
   * 編集モーダルを開く
   */
  const openEditModal = useCallback(
    (process: PlaySessionType) => {
      setEditingProcess(process)
      setEditFormData({
        sessionName: process.sessionName ?? "未設定",
        chapterId: process.chapterId
      })
      validation.resetTouched() // タッチ状態をリセット
      setIsEditModalOpen(true)
    },
    [validation]
  )

  /**
   * 編集モーダルを閉じる
   */
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setEditingProcess(undefined)
    setEditFormData({
      sessionName: "",
      chapterId: null
    })
    validation.resetTouched() // タッチ状態をリセット
  }, [validation])

  /**
   * フォーム入力変更処理
   */
  const handleFormChange = useCallback(
    (field: EditFormFields, value: string | null) => {
      setEditFormData((prev) => ({ ...prev, [field]: value }))
      validation.touch(field)
    },
    [validation]
  )

  /**
   * セッション編集処理
   */
  const handleEditSession = useCallback(async () => {
    if (!editingProcess) return

    // バリデーション実行
    const validationResult = validation.validate()
    if (!validationResult.isValid) {
      showToast("入力内容に問題があります", "error")
      return
    }

    try {
      // セッション名を更新
      if (memoizedEditFormData.sessionName !== editingProcess.sessionName) {
        const nameResult = await window.api.database.updateSessionName(
          editingProcess.id,
          memoizedEditFormData.sessionName
        )
        if (!nameResult.success) {
          showToast("セッション名の更新に失敗しました", "error")
          return
        }
      }

      // 章を更新
      const chapterResult = await window.api.database.updateSessionChapter(
        editingProcess.id,
        memoizedEditFormData.chapterId
      )
      if (!chapterResult.success) {
        showToast("章の更新に失敗しました", "error")
        return
      }

      showToast("セッションを更新しました", "success")
      await fetchProcesses()
      onProcessUpdated?.()
      closeEditModal()
    } catch (error) {
      console.error("セッション編集エラー:", error)
      showToast("セッションの更新に失敗しました", "error")
    }
  }, [
    editingProcess,
    memoizedEditFormData,
    validation,
    fetchProcesses,
    onProcessUpdated,
    showToast,
    closeEditModal
  ])

  /**
   * セッション削除処理
   */
  const handleDeleteProcess = useCallback(async () => {
    if (!selectedProcessId) return

    try {
      const result = await window.api.database.deletePlaySession(selectedProcessId)
      if (result.success) {
        showToast("セッションを削除しました", "success")
        await fetchProcesses()
        onProcessUpdated?.()
      } else {
        showToast("セッションの削除に失敗しました", "error")
      }
    } catch (error) {
      console.error("セッション削除エラー:", error)
      showToast("セッションの削除に失敗しました", "error")
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedProcessId(undefined)
    }
  }, [selectedProcessId, fetchProcesses, onProcessUpdated, showToast])

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
    setSelectedProcessId(undefined)
  }, [])

  /**
   * モーダルが開かれたときにセッション情報を取得
   */
  useEffect(() => {
    if (isOpen) {
      fetchProcesses()
      fetchChapters()
    }
  }, [isOpen, fetchProcesses, fetchChapters])

  /**
   * 選択されたセッションの情報を取得
   */
  const selectedProcess = processes.find((p) => p.id === selectedProcessId)

  return (
    <>
      {/* セッション管理モーダル */}
      <div className={`modal ${isOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-4xl max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="font-bold text-lg">セッション管理 - {gameTitle}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              <RxCross1 />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-base-content/30 scrollbar-track-transparent">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <div className="space-y-4">
                {processes.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    このゲームに関連するセッションがありません
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>セッション名</th>
                          <th>章</th>
                          <th>実行時間</th>
                          <th>プレイ日時</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processes.map((process) => (
                          <tr key={process.id}>
                            <td>
                              <div className="font-medium">{process.sessionName ?? "未設定"}</div>
                            </td>
                            <td>{process.chapter?.name ?? "未設定"}</td>
                            <td>{formatSmart(process.duration)}</td>
                            <td>{formatDateWithTime(process.playedAt)}</td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline btn-primary"
                                  onClick={() => openEditModal(process)}
                                >
                                  <FaEdit />
                                  編集
                                </button>
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
          </div>

          <div className="modal-action flex-shrink-0">
            <button className="btn" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        id="delete-session-modal"
        isOpen={isDeleteModalOpen}
        message={`セッション「${selectedProcess?.sessionName || "未設定"}」を削除しますか？\nこの操作は取り消せません。`}
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={handleDeleteProcess}
        onCancel={closeDeleteModal}
      />

      {/* 編集モーダル */}
      <div className={`modal ${isEditModalOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">セッション編集</h3>

          <div className="space-y-4">
            {/* セッション名 */}
            <div>
              <label className="label">
                <span className="label-text">セッション名</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${
                  validation.hasError("sessionName") ? "input-error" : ""
                }`}
                value={editFormData.sessionName}
                onChange={(e) => handleFormChange("sessionName", e.target.value)}
                placeholder="セッション名を入力"
              />
              {validation.getError("sessionName") && (
                <div className="text-error text-sm mt-1">{validation.getError("sessionName")}</div>
              )}
            </div>

            {/* 章選択 */}
            <div>
              <label className="label">
                <span className="label-text">紐づける章</span>
              </label>
              <select
                className={`select select-bordered w-full ${
                  validation.hasError("chapterId") ? "select-error" : ""
                }`}
                value={editFormData.chapterId || ""}
                onChange={(e) => handleFormChange("chapterId", e.target.value || null)}
              >
                <option value="">章を選択しない</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
              {validation.getError("chapterId") && (
                <div className="text-error text-sm mt-1">{validation.getError("chapterId")}</div>
              )}
            </div>
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={closeEditModal}>
              キャンセル
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSession}
              disabled={!editFormData.sessionName.trim()}
            >
              更新
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
