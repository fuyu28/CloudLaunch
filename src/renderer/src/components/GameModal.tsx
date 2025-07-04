/**
 * @fileoverview ゲーム登録・編集モーダルコンポーネント
 *
 * このコンポーネントは、新規ゲーム登録と既存ゲーム編集の両方に対応したモーダルフォームです。
 * 主な機能：
 * - ゲーム基本情報の入力（タイトル、発行元、実行ファイルパス等）
 * - ファイル・フォルダ選択のためのネイティブダイアログ連携
 * - リアルタイムバリデーション（必須フィールドチェック）
 * - エラーハンドリングとユーザー向けトースト通知
 *
 * 使用技術：
 * - React Hooks（useState, useEffect, useCallback, useMemo）
 * - DaisyUI モーダルコンポーネント
 * - react-hot-toast エラー通知
 */

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { RxCross1 } from "react-icons/rx"
import toast from "react-hot-toast"
import type { InputGameData } from "../../../types/game"
import type { ApiResult } from "../../../types/result"

type GameFormModalProps = {
  mode: "add" | "edit"
  initialData?: InputGameData | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (gameData: InputGameData) => Promise<ApiResult>
}

const initialValues: InputGameData = {
  title: "",
  publisher: "",
  saveFolderPath: "",
  exePath: "",
  imagePath: "",
  playStatus: "unplayed"
}

const modeMap: Record<string, string> = {
  add: "追加",
  edit: "更新"
}

export default function GameFormModal({
  mode,
  initialData,
  isOpen,
  onClose,
  onSubmit
}: GameFormModalProps): React.JSX.Element {
  const [gameData, setGameData] = useState<InputGameData>(
    mode === "edit" && initialData ? initialData : initialValues
  )
  const [submitting, setSubmitting] = useState(false)
  const [isBrowsing, setIsBrowsing] = useState(false) // 新しいstate

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setGameData(initialData)
    } else {
      setGameData(initialValues)
    }
  }, [initialData, isOpen, mode])

  const browseImage = useCallback(async () => {
    setIsBrowsing(true) // 参照開始
    try {
      const result = await window.api.file.selectFile([
        { name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }
      ])
      if (result.success) {
        if (result.data !== null) {
          setGameData((prev) => ({ ...prev, imagePath: result.data ?? "" }))
        }
      } else {
        if (!result.success) {
          toast.error(result.message)
        } else {
          toast.error("エラーが発生しました")
        }
      }
    } finally {
      setIsBrowsing(false) // 参照終了
    }
  }, [])

  const browseExe = useCallback(async () => {
    setIsBrowsing(true) // 参照開始
    try {
      const result = await window.api.file.selectFile([
        { name: "Executable", extensions: ["exe", "app"] }
      ])
      if (result.success) {
        if (result.data !== null) {
          setGameData((prev) => ({ ...prev, exePath: result.data ?? "" }))
        }
      } else {
        if (!result.success) {
          toast.error(result.message)
        } else {
          toast.error("エラーが発生しました")
        }
      }
    } finally {
      setIsBrowsing(false) // 参照終了
    }
  }, [])

  const browseSaveFolder = useCallback(async () => {
    setIsBrowsing(true) // 参照開始
    try {
      const result = await window.api.file.selectFolder()
      if (result.success) {
        if (result.data !== null) {
          setGameData((prev) => ({ ...prev, saveFolderPath: result.data ?? "" }))
        }
      } else {
        if (!result.success) {
          toast.error(result.message)
        } else {
          toast.error("エラーが発生しました")
        }
      }
    } finally {
      setIsBrowsing(false) // 参照終了
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setGameData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await onSubmit(gameData)
      if (result.success) {
        resetForm()
        onClose()
      } else {
        if (!result.success) {
          toast.error(result.message)
        } else {
          toast.error("エラーが発生しました")
        }
      }
    } catch (err) {
      console.error("予期しないエラー : ", err)
      toast.error("予期しないエラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = (): void => {
    setGameData(initialValues)
    setSubmitting(false)
  }

  const handleCancel = (): void => {
    resetForm()
    onClose()
  }

  const canSubmit = useMemo(
    () =>
      gameData.title.trim() !== "" &&
      gameData.publisher.trim() !== "" &&
      gameData.exePath.trim() !== "",
    [gameData]
  )

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
          <h3 className="text-xl font-bold mb-4">
            {mode === "add" ? "ゲームの登録" : "ゲーム情報を編集"}
          </h3>
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
                value={gameData.title}
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
                value={gameData.publisher}
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
                  value={gameData.imagePath ?? ""}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                />
                <button
                  type="button"
                  className="btn ml-2"
                  onClick={browseImage}
                  disabled={isBrowsing}
                >
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
                  value={gameData.exePath}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                  required
                />
                <button
                  type="button"
                  className="btn ml-2"
                  onClick={browseExe}
                  disabled={isBrowsing}
                >
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
                  value={gameData.saveFolderPath}
                  onChange={handleChange}
                  className="input input-bordered flex-1"
                />
                <button
                  type="button"
                  className="btn ml-2"
                  onClick={browseSaveFolder}
                  disabled={isBrowsing}
                >
                  参照
                </button>
              </div>
            </div>
            {/* モーダルアクション */}
            <div className="modal-action justify-end">
              <button type="button" className="btn" onClick={handleCancel} disabled={submitting}>
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
              >
                {`${modeMap[mode]}${submitting ? "中…" : ""}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
