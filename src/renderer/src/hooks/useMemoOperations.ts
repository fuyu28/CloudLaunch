/**
 * @fileoverview メモ操作フック
 *
 * メモの削除、編集、閲覧などの共通操作を提供します。
 * ゲーム詳細ページとメモ一覧ページで共通使用されます。
 */

import { useNavigate } from "react-router-dom"

import { useToastHandler } from "./useToastHandler"

type UseMemoOperationsProps = {
  /** ゲームID（MemoCardコンポーネント用、オプション） */
  gameId?: string
  /** メモ削除後のコールバック（メモ一覧更新用、オプション） */
  onDeleteSuccess?: (deletedMemoId: string) => void
  /** ドロップダウンを閉じる関数 */
  closeDropdown: () => void
  /** 削除確認モーダルを開く関数 */
  openDeleteModal: (memoId: string) => void
  /** 同期後のコールバック（メモ一覧更新用、オプション） */
  onSyncSuccess?: () => void
}

type UseMemoOperationsReturn = {
  handleDeleteMemo: (memoId: string) => Promise<void>
  handleEditMemo: (memoId: string, event: React.MouseEvent) => void
  handleViewMemo: (memoId: string) => void
  handleDeleteConfirm: (memoId: string, event: React.MouseEvent) => void
  handleSyncFromCloud: (event: React.MouseEvent) => Promise<void>
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
  openDeleteModal,
  onSyncSuccess
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

  // 同期処理
  const handleSyncFromCloud = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation()
    closeDropdown()

    try {
      const result = await window.api.memo.syncMemosFromCloud(gameId)
      if (result.success && result.data) {
        console.log("同期結果:", result.data) // デバッグ用ログ
        const { uploaded, created, localOverwritten, cloudOverwritten, skipped } = result.data
        showToast(
          `同期完了: 新規アップロード${uploaded ?? 0}件、作成${created}件、ローカル更新${localOverwritten}件、クラウド更新${cloudOverwritten}件、スキップ${skipped}件`,
          "success"
        )
        onSyncSuccess?.()
      } else {
        showToast("メモの同期に失敗しました", "error")
      }
    } catch (error) {
      console.error("メモ同期エラー:", error)
      showToast("メモの同期中にエラーが発生しました", "error")
    }
  }

  return {
    handleDeleteMemo,
    handleEditMemo,
    handleViewMemo,
    handleDeleteConfirm,
    handleSyncFromCloud
  }
}
