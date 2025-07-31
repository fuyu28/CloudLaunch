/**
 * @fileoverview 章設定モーダルコンポーネント
 *
 * 章の編集、削除、順序変更を行うためのモーダルダイアログです。
 * 章の一覧表示と各章の操作機能を提供します。
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { FaEdit, FaTrash, FaChevronUp, FaChevronDown, FaTimes, FaSave } from "react-icons/fa"

import { logger } from "@renderer/utils/logger"

import ConfirmModal from "./ConfirmModal"
import { chapterUpdateSchema } from "../../../schemas/chapter"
import type { Chapter } from "../../../types/chapter"
import { useZodValidation } from "../hooks/useZodValidation"

type ChapterSettingsModalProps = {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** ゲームID */
  gameId: string
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** 章データが更新された際のコールバック */
  onChaptersUpdated?: () => void
}

/**
 * 章設定モーダルコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns 章設定モーダルコンポーネント
 */
export default function ChapterSettingsModal({
  isOpen,
  gameId,
  onClose,
  onChaptersUpdated
}: ChapterSettingsModalProps): React.JSX.Element {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [editingChapter, setEditingChapter] = useState<Chapter | undefined>(undefined)
  const [editName, setEditName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingChapter, setDeletingChapter] = useState<Chapter | undefined>(undefined)

  // 編集用フォームデータ
  const editFormData = useMemo(() => ({ name: editName.trim() }), [editName])

  // バリデーション
  const validation = useZodValidation(chapterUpdateSchema, editFormData)

  // 章データを取得
  const fetchChapters = useCallback(async (): Promise<void> => {
    if (!gameId || !isOpen) return

    try {
      setIsLoading(true)
      const result = await window.api.chapter.getChapters(gameId)

      if (result.success && result.data) {
        setChapters(result.data.sort((a, b) => a.order - b.order))
      } else {
        logger.error("章データの取得に失敗:", {
          component: "ChapterSettingsModal",
          function: "unknown",
          data: result.success ? "データが空です" : result.message
        })
        setChapters([])
      }
    } catch (error) {
      logger.error("章データの取得に失敗:", {
        component: "ChapterSettingsModal",
        function: "unknown",
        data: error
      })
      setChapters([])
    } finally {
      setIsLoading(false)
    }
  }, [gameId, isOpen])

  useEffect(() => {
    fetchChapters()
  }, [fetchChapters])

  // 編集開始
  const startEditing = useCallback(
    (chapter: Chapter) => {
      setEditingChapter(chapter)
      setEditName(chapter.name)
      validation.resetTouched()
    },
    [validation]
  )

  // 編集キャンセル
  const cancelEditing = useCallback(() => {
    setEditingChapter(undefined)
    setEditName("")
    validation.resetTouched()
  }, [validation])

  // 編集中の名前変更
  const handleEditNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditName(e.target.value)
      validation.touch("name")
    },
    [validation]
  )

  // 章名保存
  const saveChapterName = useCallback(async (): Promise<void> => {
    if (!editingChapter) return

    // バリデーション実行
    const validationResult = validation.validate()
    if (!validationResult.isValid) {
      return
    }

    try {
      setIsSaving(true)

      const result = await window.api.chapter.updateChapter(editingChapter.id, editFormData)

      if (result.success) {
        // ローカル状態を更新
        setChapters((prev) =>
          prev.map((ch) => (ch.id === editingChapter.id ? { ...ch, name: editFormData.name } : ch))
        )
        setEditingChapter(undefined)
        setEditName("")
        validation.resetTouched()
        onChaptersUpdated?.()
      } else {
        logger.error("章名の更新に失敗:", {
          component: "ChapterSettingsModal",
          function: "unknown",
          data: result.message
        })
      }
    } catch (error) {
      logger.error("章名の更新に失敗:", {
        component: "ChapterSettingsModal",
        function: "unknown",
        data: error
      })
    } finally {
      setIsSaving(false)
    }
  }, [editingChapter, editFormData, validation, onChaptersUpdated])

  // 章削除確認モーダルを開く
  const openDeleteConfirmation = useCallback((chapter: Chapter) => {
    setDeletingChapter(chapter)
  }, [])

  // 章削除確認モーダルを閉じる
  const closeDeleteConfirmation = useCallback(() => {
    setDeletingChapter(undefined)
  }, [])

  // 章削除実行
  const confirmDeleteChapter = useCallback(async (): Promise<void> => {
    if (!deletingChapter) return

    try {
      setIsSaving(true)
      const result = await window.api.chapter.deleteChapter(deletingChapter.id)

      if (result.success) {
        // ローカル状態を更新
        setChapters((prev) => prev.filter((ch) => ch.id !== deletingChapter.id))
        setDeletingChapter(undefined)
        onChaptersUpdated?.()
      } else {
        logger.error("章の削除に失敗:", {
          component: "ChapterSettingsModal",
          function: "unknown",
          data: result.message
        })
      }
    } catch (error) {
      logger.error("章の削除に失敗:", {
        component: "ChapterSettingsModal",
        function: "unknown",
        data: error
      })
    } finally {
      setIsSaving(false)
    }
  }, [deletingChapter, onChaptersUpdated])

  // 章の順序を上に移動
  const moveChapterUp = useCallback(
    async (chapter: Chapter): Promise<void> => {
      const currentIndex = chapters.findIndex((ch) => ch.id === chapter.id)
      if (currentIndex <= 0) return

      try {
        setIsSaving(true)

        // 新しい順序を計算
        const newChapters = [...chapters]
        const temp = newChapters[currentIndex]
        newChapters[currentIndex] = newChapters[currentIndex - 1]
        newChapters[currentIndex - 1] = temp

        // order値を更新
        const chapterOrders = newChapters.map((ch, index) => ({
          id: ch.id,
          order: index + 1
        }))

        const result = await window.api.chapter.updateChapterOrders(gameId, chapterOrders)

        if (result.success) {
          // ローカル状態を更新
          newChapters.forEach((ch, index) => {
            ch.order = index + 1
          })
          setChapters(newChapters)
          onChaptersUpdated?.()
        } else {
          logger.error("章順序の更新に失敗:", {
            component: "ChapterSettingsModal",
            function: "unknown",
            data: result.message
          })
        }
      } catch (error) {
        logger.error("章順序の更新に失敗:", {
          component: "ChapterSettingsModal",
          function: "unknown",
          data: error
        })
      } finally {
        setIsSaving(false)
      }
    },
    [chapters, gameId, onChaptersUpdated]
  )

  // 章の順序を下に移動
  const moveChapterDown = useCallback(
    async (chapter: Chapter): Promise<void> => {
      const currentIndex = chapters.findIndex((ch) => ch.id === chapter.id)
      if (currentIndex >= chapters.length - 1) return

      try {
        setIsSaving(true)

        // 新しい順序を計算
        const newChapters = [...chapters]
        const temp = newChapters[currentIndex]
        newChapters[currentIndex] = newChapters[currentIndex + 1]
        newChapters[currentIndex + 1] = temp

        // order値を更新
        const chapterOrders = newChapters.map((ch, index) => ({
          id: ch.id,
          order: index + 1
        }))

        const result = await window.api.chapter.updateChapterOrders(gameId, chapterOrders)

        if (result.success) {
          // ローカル状態を更新
          newChapters.forEach((ch, index) => {
            ch.order = index + 1
          })
          setChapters(newChapters)
          onChaptersUpdated?.()
        } else {
          logger.error("章順序の更新に失敗:", {
            component: "ChapterSettingsModal",
            function: "unknown",
            data: result.message
          })
        }
      } catch (error) {
        logger.error("章順序の更新に失敗:", {
          component: "ChapterSettingsModal",
          function: "unknown",
          data: error
        })
      } finally {
        setIsSaving(false)
      }
    },
    [chapters, gameId, onChaptersUpdated]
  )

  if (!isOpen) return <></>

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">章設定</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chapters.length === 0 ? (
              <div className="text-center text-base-content/60 py-8">
                <p>章がありません</p>
              </div>
            ) : (
              chapters.map((chapter, index) => (
                <div key={chapter.id} className="card bg-base-200 p-4">
                  <div className="flex items-center justify-between">
                    {/* 章情報 */}
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm text-base-content/60 w-8">{chapter.order}</span>

                      {editingChapter?.id === chapter.id ? (
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={handleEditNameChange}
                              className={`input input-sm input-bordered flex-1 ${
                                validation.hasError("name") ? "input-error" : ""
                              }`}
                              placeholder="章名を入力"
                              disabled={isSaving}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={saveChapterName}
                              disabled={!validation.canSubmit || isSaving}
                            >
                              <FaSave />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={cancelEditing}
                              disabled={isSaving}
                            >
                              <FaTimes />
                            </button>
                          </div>
                          {validation.getError("name") && (
                            <div className="text-error text-xs">{validation.getError("name")}</div>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium flex-1">{chapter.name}</span>
                      )}
                    </div>

                    {/* アクションボタン */}
                    {editingChapter?.id !== chapter.id && (
                      <div className="flex items-center gap-1">
                        {/* 順序変更ボタン */}
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => moveChapterUp(chapter)}
                          disabled={index === 0 || isSaving}
                        >
                          <FaChevronUp />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => moveChapterDown(chapter)}
                          disabled={index === chapters.length - 1 || isSaving}
                        >
                          <FaChevronDown />
                        </button>

                        {/* 編集・削除ボタン */}
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => startEditing(chapter)}
                          disabled={isSaving}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error"
                          onClick={() => openDeleteConfirmation(chapter)}
                          disabled={isSaving}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="modal-action mt-6">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        id="delete-chapter-modal"
        isOpen={!!deletingChapter}
        message={`「${deletingChapter?.name}」を削除しますか？\nこの操作は取り消せません。`}
        cancelText="キャンセル"
        confirmText="削除する"
        onConfirm={confirmDeleteChapter}
        onCancel={closeDeleteConfirmation}
      />
    </div>
  )
}
