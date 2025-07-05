/**
 * @fileoverview ゲーム操作フック
 *
 * このファイルは、ゲームの追加・編集・削除に関する共通ロジックを提供します。
 * 主な機能：
 * - ゲーム追加処理のカプセル化
 * - ゲーム一覧の再取得とUI更新
 * - エラーハンドリングの統一
 * - ローディング状態の管理
 */

import { useCallback } from "react"
import { useLoadingState } from "./useLoadingState"
import { MESSAGES } from "../../../constants"
import type { InputGameData, Game } from "../../../types/game"
import type { ApiResult } from "../../../types/result"
import type { SortOption, FilterOption } from "../../../types/menu"

/// <reference types="../../../preload/index.d.ts" />

/**
 * ゲーム操作フックのprops
 */
export interface UseGameActionsProps {
  /** 現在の検索ワード */
  searchWord: string
  /** 現在のフィルター */
  filter: FilterOption
  /** 現在のソート */
  sort: SortOption
  /** ゲーム一覧の更新コールバック */
  onGamesUpdate: (games: Game[]) => void
  /** モーダルクローズのコールバック */
  onModalClose: () => void
}

/**
 * ゲーム操作フック
 *
 * ゲーム追加・編集・削除に関する操作と状態管理を提供します。
 *
 * @param props フックのprops
 * @returns ゲーム操作に関するstate, handler
 */
export function useGameActions({
  searchWord,
  filter,
  sort,
  onGamesUpdate,
  onModalClose
}: UseGameActionsProps): {
  createGameAndRefreshList: (values: InputGameData) => Promise<ApiResult<void>>
  isLoading: boolean
} {
  const gameActionLoading = useLoadingState()

  /**
   * ゲーム追加処理
   * @param values ゲームデータ
   * @returns 処理結果
   */
  const createGameAndRefreshList = useCallback(
    async (values: InputGameData): Promise<ApiResult<void>> => {
      const result = await gameActionLoading.executeWithLoading(
        async () => {
          const createResult = await window.api.database.createGame(values)
          if (!createResult.success) {
            throw new Error(createResult.message)
          }

          // ゲーム一覧を再取得
          const games = await window.api.database.listGames(searchWord, filter, sort)
          onGamesUpdate(games)
          onModalClose()

          return createResult
        },
        {
          loadingMessage: MESSAGES.GAME.ADDING,
          successMessage: MESSAGES.GAME.ADDED,
          showToast: true
        }
      )

      return result || { success: false, message: MESSAGES.GAME.ADD_FAILED }
    },
    [searchWord, filter, sort, onGamesUpdate, onModalClose, gameActionLoading]
  )

  return {
    /** ゲーム追加とリスト更新 */
    createGameAndRefreshList,
    /** ローディング状態 */
    isLoading: gameActionLoading.isLoading
  }
}
