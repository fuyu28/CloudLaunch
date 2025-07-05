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

import React, { useState, useEffect, useCallback } from "react"
import { handleApiError, handleUnexpectedError } from "../utils/errorHandler"
import { useFileSelection } from "../hooks/useFileSelection"
import { useGameFormValidation } from "../hooks/useGameFormValidation"
import { GameFormFields } from "./GameFormFields"
import { BaseModal } from "./BaseModal"
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
  const { isBrowsing, selectFile, selectFolder } = useFileSelection()
  const { canSubmit } = useGameFormValidation(gameData)

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setGameData(initialData)
    } else {
      setGameData(initialValues)
    }
  }, [initialData, isOpen, mode])

  const browseImage = useCallback(async () => {
    await selectFile([{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }], (filePath) => {
      setGameData((prev) => ({ ...prev, imagePath: filePath }))
    })
  }, [selectFile])

  const browseExe = useCallback(async () => {
    await selectFile([{ name: "Executable", extensions: ["exe", "app"] }], (filePath) => {
      setGameData((prev) => ({ ...prev, exePath: filePath }))
    })
  }, [selectFile])

  const browseSaveFolder = useCallback(async () => {
    await selectFolder((folderPath) => {
      setGameData((prev) => ({ ...prev, saveFolderPath: folderPath }))
    })
  }, [selectFolder])

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
        handleApiError(result, "エラーが発生しました")
      }
    } catch (error) {
      handleUnexpectedError(error, "ゲーム情報の送信")
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

  const footer = (
    <div className="flex justify-end space-x-2">
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
  )

  return (
    <BaseModal
      id="game-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "ゲームの登録" : "ゲーム情報を編集"}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <GameFormFields
          gameData={gameData}
          onChange={handleChange}
          onBrowseImage={browseImage}
          onBrowseExe={browseExe}
          onBrowseSaveFolder={browseSaveFolder}
          disabled={submitting || isBrowsing}
        />
      </form>
    </BaseModal>
  )
}
