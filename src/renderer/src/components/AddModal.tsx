import React, { useState } from "react"
import type { GameType } from "src/types/game"

interface GameFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: GameType) => void
}

export default function GameFormModal({
  isOpen,
  onClose,
  onSubmit
}: GameFormModalProps): React.JSX.Element {
  // GameType の型に合わせて初期値を設定
  const [values, setValues] = useState<GameType>({
    id: 0,
    title: "",
    publisher: "",
    folderPath: "",
    exePath: "",
    imagePath: "",
    createdAt: new Date(),
    playStatus: "unplayed",
    totalPlayTime: 0,
    lastPlayed: null
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit(values)
    onClose()
  }

  return (
    <>
      <input
        type="checkbox"
        id="game-form-modal"
        className="modal-toggle"
        checked={isOpen}
        readOnly
      />
      <label htmlFor="game-form-modal" className="modal cursor-pointer">
        <label className="modal-box relative max-w-lg" htmlFor="">
          <h3 className="text-xl font-bold mb-4">ゲームの登録</h3>
          <button
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={onClose}
            type="button"
          >
            ✕
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
                value={values.title}
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
                value={values.publisher}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            {/* サムネイルパス */}
            <div>
              <label className="label">
                <span className="label-text">サムネイル画像の場所 (URLまたはファイルパス)</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="imagePath"
                  value={values.imagePath ?? ""}
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
                  value={values.exePath}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                />
                <button type="button" className="btn ml-2">
                  参照
                </button>
              </div>
            </div>
            {/* モーダルアクション */}
            <div className="modal-action justify-end">
              <button type="button" className="btn" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                登録
              </button>
            </div>
          </form>
        </label>
      </label>
    </>
  )
}
