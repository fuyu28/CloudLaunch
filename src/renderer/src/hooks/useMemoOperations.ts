/**
 * @fileoverview メモ操作フック
 *
 * メモの削除、編集、閲覧などの共通操作を提供します。
 * ゲーム詳細ページとメモ一覧ページで共通使用されます。
 */

import { useNavigate } from "react-router-dom"
import { useToastHandler } from "./useToastHandler"

interface UseMemoOperationsProps {
  /** ゲームID（MemoCardコンポーネント用、オプション） */
  gameId?: string
  /** メモ削除後のコールバック（メモ一覧更新用、オプション） */
  onDeleteSuccess?: (deletedMemoId: string) => void
  /** ドロップダウンを閉じる関数 */
  closeDropdown: () => void
  /** 削除確認モーダルを開く関数 */
  openDeleteModal: (memoId: string) => void
}

interface UseMemoOperationsReturn {
  handleDeleteMemo: (memoId: string) => Promise<void>
  handleEditMemo: (memoId: string, event: React.MouseEvent) => void
  handleViewMemo: (memoId: string) => void
  handleDeleteConfirm: (memoId: string, event: React.MouseEvent) => void
}

/**
 * メモ操作フック
 *
 * @param props - フックの設定オプション
 * @returns メモ操作用の関数群
 */
export function useMemoOperations({
  gameId,
  onDeleteSuccess,
  closeDropdown,
  openDeleteModal
}: UseMemoOperationsProps): UseMemoOperationsReturn {
  const navigate = useNavigate()
  const { showToast } = useToastHandler()

  // メモ削除処理
  const handleDeleteMemo = async (memoId: string): Promise<void> => {
    try {
      const result = await window.api.memo.deleteMemo(memoId)
      if (result.success) {
        showToast("メモを削除しました", "success")
        onDeleteSuccess?.(memoId)
      } else {
        showToast("メモの削除に失敗しました", "error")
      }
    } catch (error) {
      console.error("メモ削除エラー:", error)
      showToast("メモの削除中にエラーが発生しました", "error")
    }
  }

  // 編集ページへの遷移
  const handleEditMemo = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    closeDropdown()

    if (gameId) {
      // MemoCardから来た場合はクエリパラメータを付与
      navigate(`/memo/edit/${memoId}?from=game&gameId=${gameId}`)
    } else {
      // メモ一覧から来た場合は通常遷移
      navigate(`/memo/edit/${memoId}`)
    }
  }

  // メモ詳細ページへの遷移
  const handleViewMemo = (memoId: string): void => {
    if (gameId) {
      // MemoCardから来た場合はクエリパラメータを付与
      navigate(`/memo/view/${memoId}?from=game&gameId=${gameId}`)
    } else {
      // メモ一覧から来た場合は通常遷移
      navigate(`/memo/view/${memoId}`)
    }
  }

  // 削除確認処理
  const handleDeleteConfirm = (memoId: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    closeDropdown()
    openDeleteModal(memoId)
  }

  return {
    handleDeleteMemo,
    handleEditMemo,
    handleViewMemo,
    handleDeleteConfirm
  }
}
