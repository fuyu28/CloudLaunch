/**
 * @fileoverview 章追加モーダルコンポーネント
 *
 * 新しい章を追加するためのモーダルダイアログです。
 * 章名の入力と作成処理を提供します。
 */

import { useState, useCallback } from "react"
import { FaPlus, FaTimes } from "react-icons/fa"

interface ChapterAddModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** ゲームID */
  gameId: string
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** 章が追加された際のコールバック */
  onChapterAdded?: () => void
}

/**
 * 章追加モーダルコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns 章追加モーダルコンポーネント
 */
export default function ChapterAddModal({
  isOpen,
  gameId,
  onClose,
  onChapterAdded
}: ChapterAddModalProps): React.JSX.Element {
  const [chapterName, setChapterName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setChapterName("")
    onClose()
  }, [isSubmitting, onClose])

  // 章を追加
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!chapterName.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)

      const result = await window.api.chapter.createChapter({
        name: chapterName.trim(),
        gameId
      })

      if (result.success) {
        // 成功時の処理
        setChapterName("")
        onChapterAdded?.()
        onClose()
      } else {
        console.error("章の追加に失敗:", result.message)
      }
    } catch (error) {
      console.error("章の追加に失敗:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [chapterName, gameId, isSubmitting, onChapterAdded, onClose])

  // Enterキーでの送信
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  if (!isOpen) return <></>

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">新しい章を追加</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">章名</span>
            </label>
            <input
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-full"
              placeholder="例: 第1章、プロローグ、エピローグ"
              disabled={isSubmitting}
              autoFocus
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">章名を入力してください</span>
            </label>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!chapterName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                追加中...
              </>
            ) : (
              <>
                <FaPlus />
                追加
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
