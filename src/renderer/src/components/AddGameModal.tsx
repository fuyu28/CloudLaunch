import React, { useEffect } from "react"
import { useAtom } from "jotai"
import { RxCross1 } from "react-icons/rx"
import type { InputGameData } from "src/types/game"
import type { ApiResult } from "src/types/result"
import {
  addGameModalErrorAtom,
  canSubmitAtom,
  gameFormValuesAtom,
  submittingAtom
} from "@renderer/state/atoms"

type GameFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: InputGameData) => Promise<ApiResult>
}

export default function GameFormModal({
  isOpen,
  onClose,
  onSubmit
}: GameFormModalProps): React.JSX.Element {
  const [gameFormValues, setGameFormValues] = useAtom(gameFormValuesAtom)
  const [error, setError] = useAtom<string | null>(addGameModalErrorAtom)
  const [submitting, setSubmitting] = useAtom(submittingAtom)
  const [canSubmit, setCanSubmit] = useAtom(canSubmitAtom)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setGameFormValues((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await onSubmit(gameFormValues)
      if (result.success) {
        onClose()
      } else {
        setError(result.message ?? "登録に失敗しました。")
      }
    } catch (e) {
      console.error("予期しないエラー : ", e)
      setError("予期しないエラーが発生しました。")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    setCanSubmit(
      gameFormValues.title.trim() !== "" &&
        gameFormValues.publisher.trim() !== "" &&
        gameFormValues.exePath.trim() !== "" &&
        gameFormValues.saveFolderPath.trim() !== ""
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFormValues])

  return (
    <>
      <input
        type="checkbox"
        id="game-form-modal"
        className="modal-toggle"
        checked={isOpen}
        readOnly
      />
      <div className="modal cursor-pointer">
        <div className="modal-box relative max-w-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">ゲームの登録</h3>
          {/* 閉じるボタン */}
          <button
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={onClose}
            type="button"
          >
            <RxCross1 />
          </button>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タイトル */}
            <div>
              <label className="label">
                <span className="label-text">タイトル</span>
              </label>
              <input
                type="text"
                name="title"
                value={gameFormValues.title}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            {/* ブランド */}
            <div>
              <label className="label">
                <span className="label-text">ブランド</span>
              </label>
              <input
                type="text"
                name="publisher"
                value={gameFormValues.publisher}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            {/* サムネイルパス */}
            <div>
              <label className="label">
                <span className="label-text">サムネイル画像の場所</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="imagePath"
                  value={gameFormValues.imagePath ?? ""}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                />
                <button type="button" className="btn ml-2">
                  参照
                </button>
              </div>
            </div>
            {/* 実行ファイルパス */}
            <div>
              <label className="label">
                <span className="label-text">実行ファイルの場所</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="exePath"
                  value={gameFormValues.exePath}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                  required
                />
                <button type="button" className="btn ml-2">
                  参照
                </button>
              </div>
            </div>
            {/* セーブデータのパス */}
            <div>
              <label className="label">
                <span className="label-text">セーブデータフォルダの場所</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="saveFolderPath"
                  value={gameFormValues.saveFolderPath}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                  required
                />
                <button type="button" className="btn ml-2">
                  参照
                </button>
              </div>
            </div>
            {/* モーダルアクション */}
            {error && <p className="text-error text-sm">{error}</p>}
            <div className="modal-action justify-end">
              <button type="button" className="btn" onClick={onClose} disabled={submitting}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !canSubmit}>
                {submitting ? "登録中…" : "登録"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
