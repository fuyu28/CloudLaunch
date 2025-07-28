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

import { useState, useEffect, useCallback, useRef } from "react"

import { BaseModal } from "./BaseModal"
import { GameFormFields } from "./GameFormFields"
import type { InputGameData } from "../../../types/game"
import type { ApiResult } from "../../../types/result"
import { useFileSelection } from "../hooks/useFileSelection"
import { useGameFormValidationZod } from "../hooks/useGameFormValidationZod"
import { handleApiError, handleUnexpectedError } from "../utils/errorHandler"

type GameFormModalProps = {
  mode: "add" | "edit"
  initialData?: InputGameData | undefined
  isOpen: boolean
  onClose: () => void
  onClosed?: () => void
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
  onClosed,
  onSubmit
}: GameFormModalProps): React.JSX.Element {
  const [gameData, setGameData] = useState<InputGameData>(
    mode === "edit" && initialData ? initialData : initialValues
  )
  const [submitting, setSubmitting] = useState(false)
  const { isBrowsing, selectFile, selectFolder } = useFileSelection()
  const validation = useGameFormValidationZod(gameData)
  const prevIsOpenRef = useRef(isOpen)

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setGameData(initialData)
    } else {
      setGameData(initialValues)
    }
  }, [initialData, isOpen, mode])

  // モーダルが開かれるたびにtouchedFieldsをリセット
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      validation.resetTouchedFields()
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, validation])

  const browseImage = useCallback(async () => {
    await selectFile([{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }], (filePath) => {
      setGameData((prev) => ({ ...prev, imagePath: filePath }))
      // ファイル選択後にリアルタイムバリデーションをトリガー
      validation.markFieldAsTouched("imagePath")
      // ファイル存在チェックを実行
      validation.validateFileField("imagePath")
    })
  }, [selectFile, validation])

  const browseExe = useCallback(async () => {
    await selectFile([{ name: "Executable", extensions: ["exe", "app"] }], (filePath) => {
      setGameData((prev) => ({ ...prev, exePath: filePath }))
      // ファイル選択後にリアルタイムバリデーションをトリガー
      validation.markFieldAsTouched("exePath")
      // ファイル存在チェックを実行
      validation.validateFileField("exePath")
    })
  }, [selectFile, validation])

  const browseSaveFolder = useCallback(async () => {
    await selectFolder((folderPath) => {
      setGameData((prev) => ({ ...prev, saveFolderPath: folderPath }))
      // フォルダ選択後にリアルタイムバリデーションをトリガー
      validation.markFieldAsTouched("saveFolderPath")
      // ファイル存在チェックを実行
      validation.validateFileField("saveFolderPath")
    })
  }, [selectFolder, validation])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setGameData((prev) => ({
      ...prev,
      [name]: value
    }))

    // リアルタイムバリデーションのためフィールドをタッチ済みとしてマーク
    validation.markFieldAsTouched(name as keyof InputGameData)

    // ファイル存在チェックはuseGameFormValidationZodのuseEffectで自動実行される
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    // 送信前にすべてのフィールドをタッチ済みにしてエラーを表示
    validation.markAllFieldsAsTouched()

    setSubmitting(true)
    try {
      // ファイル存在チェックを含む非同期バリデーションを実行
      const validationResult = await validation.validateAllFieldsWithFileCheck()
      if (!validationResult.isValid) {
        // バリデーションエラーがある場合は送信を停止
        return
      }

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
    validation.resetTouchedFields()
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
        disabled={submitting || !validation.canSubmit}
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
      onClosed={onClosed}
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
          validation={validation}
        />
      </form>
    </BaseModal>
  )
}
