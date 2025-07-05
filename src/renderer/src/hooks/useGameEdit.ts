/**
 * @fileoverview ゲーム編集操作フック
 *
 * このフックは、ゲームの編集・削除・起動機能を提供します。
 *
 * 主な機能：
 * - ゲーム情報の更新
 * - ゲームの削除
 * - ゲームの起動
 * - モーダル状態の管理
 * - エラーハンドリング
 *
 * 使用例：
 * ```tsx
 * const {
 *   editData,
 *   isEditModalOpen,
 *   isDeleteModalOpen,
 *   openEdit,
 *   closeEdit,
 *   openDelete,
 *   closeDelete,
 *   handleUpdateGame,
 *   handleDeleteGame,
 *   handleLaunchGame,
 *   isLaunching
 * } = useGameEdit(game, navigate, setFilteredGames)
 * ```
 */

import { useState, useCallback } from "react"
import { NavigateFunction } from "react-router-dom"
import { handleApiError, showSuccessToast } from "@renderer/utils/errorHandler"
import type { Game, InputGameData } from "../../../types/game"
import type { ApiResult } from "../../../types/result"

type SetterOrUpdater<Value> = (value: Value | ((prev: Value) => Value)) => void

/**
 * ゲーム編集操作フックの戻り値
 */
export interface GameEditResult {
  /** 編集用のゲームデータ */
  editData: InputGameData | null
  /** 編集モーダルが開いているかどうか */
  isEditModalOpen: boolean
  /** 削除モーダルが開いているかどうか */
  isDeleteModalOpen: boolean
  /** ゲーム起動中かどうか */
  isLaunching: boolean
  /** 編集モーダルを開く */
  openEdit: () => void
  /** 編集モーダルを閉じる */
  closeEdit: () => void
  /** 削除モーダルを開く */
  openDelete: () => void
  /** 削除モーダルを閉じる */
  closeDelete: () => void
  /** ゲーム情報を更新する */
  handleUpdateGame: (values: InputGameData) => Promise<ApiResult<void>>
  /** ゲームを削除する */
  handleDeleteGame: () => Promise<void>
  /** ゲームを起動する */
  handleLaunchGame: () => Promise<void>
}

/**
 * ゲーム編集操作フック
 *
 * ゲームの編集・削除・起動機能を提供します。
 *
 * @param game 操作対象のゲーム
 * @param navigate ナビゲーション関数
 * @param setFilteredGames ゲーム一覧更新関数
 * @returns ゲーム編集操作機能
 */
export function useGameEdit(
  game: Game | undefined,
  navigate: NavigateFunction,
  setFilteredGames: SetterOrUpdater<Game[]>
): GameEditResult {
  const [editData, setEditData] = useState<InputGameData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)

  /**
   * 編集モーダルを開く
   */
  const openEdit = useCallback(() => {
    if (!game) return

    const { title, publisher, imagePath, exePath, saveFolderPath, playStatus } = game
    setEditData({
      title,
      publisher,
      imagePath: imagePath ?? undefined,
      exePath,
      saveFolderPath: saveFolderPath ?? undefined,
      playStatus
    })
    setIsEditModalOpen(true)
  }, [game])

  /**
   * 編集モーダルを閉じる
   */
  const closeEdit = useCallback(() => {
    setIsEditModalOpen(false)
    setEditData(null)
  }, [])

  /**
   * 削除モーダルを開く
   */
  const openDelete = useCallback(() => {
    setIsDeleteModalOpen(true)
  }, [])

  /**
   * 削除モーダルを閉じる
   */
  const closeDelete = useCallback(() => {
    setIsDeleteModalOpen(false)
  }, [])

  /**
   * ゲーム情報を更新する
   *
   * @param values 更新するゲーム情報
   * @returns 更新結果
   */
  const handleUpdateGame = useCallback(
    async (values: InputGameData): Promise<ApiResult<void>> => {
      if (!game) {
        return { success: false, message: "ゲームが見つかりません。" }
      }

      const result = await window.api.database.updateGame(game.id, values)

      if (result.success) {
        showSuccessToast("ゲーム情報を更新しました。")

        // ゲーム一覧を更新
        setFilteredGames((list) => list.map((g) => (g.id === game.id ? { ...g, ...values } : g)))

        closeEdit()
      } else {
        handleApiError(result)
      }

      return result
    },
    [game, setFilteredGames, closeEdit]
  )

  /**
   * ゲームを削除する
   */
  const handleDeleteGame = useCallback(async (): Promise<void> => {
    if (!game) return

    const result = await window.api.database.deleteGame(game.id)

    if (result.success) {
      showSuccessToast("ゲームを削除しました。")

      // ゲーム一覧からを削除
      setFilteredGames((g) => g.filter((x) => x.id !== game.id))

      // ホームページに戻る
      navigate("/", { replace: true })
    } else {
      handleApiError(result)
    }

    closeDelete()
  }, [game, navigate, setFilteredGames, closeDelete])

  /**
   * ゲームを起動する
   */
  const handleLaunchGame = useCallback(async (): Promise<void> => {
    if (!game) return

    setIsLaunching(true)

    try {
      const result = await window.api.game.launchGame(game.exePath)

      if (result.success) {
        showSuccessToast("ゲームを起動しました。")
      } else {
        handleApiError(result)
      }
    } finally {
      setIsLaunching(false)
    }
  }, [game])

  return {
    editData,
    isEditModalOpen,
    isDeleteModalOpen,
    isLaunching,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
    handleUpdateGame,
    handleDeleteGame,
    handleLaunchGame
  }
}

export default useGameEdit
