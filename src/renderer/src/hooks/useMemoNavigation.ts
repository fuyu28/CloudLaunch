/**
 * @fileoverview メモナビゲーションフック
 *
 * メモページ間のナビゲーション処理を統一します。
 * クエリパラメータによる適切な戻り先の判定と遷移を提供します。
 */

import { useNavigate, useSearchParams } from "react-router-dom"

type UseMemoNavigationReturn = {
  /** 戻るボタンの処理 */
  handleBack: () => void
  /** 編集保存成功時の処理 */
  handleSaveSuccess: (effectiveGameId: string, mode: "create" | "edit", memoId?: string) => void
  /** クエリパラメータの取得 */
  searchParams: URLSearchParams
  /** ゲーム詳細ページから来たかどうか */
  isFromGame: boolean
  /** ゲームID（クエリパラメータから） */
  gameIdParam: string | null
}

/**
 * メモナビゲーションフック
 *
 * @returns ナビゲーション処理用の関数群と状態
 */
export function useMemoNavigation(): UseMemoNavigationReturn {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const fromParam = searchParams.get("from")
  const gameIdParam = searchParams.get("gameId")
  const isFromGame = fromParam === "game" && gameIdParam !== null

  // 戻るボタン処理
  const handleBack = (): void => {
    if (isFromGame && gameIdParam) {
      // MemoCardから来た場合は、ゲーム詳細ページに戻る
      navigate(`/game/${gameIdParam}`)
    } else {
      // その他の場合は、ブラウザの戻る
      navigate(-1)
    }
  }

  // 保存成功時の処理
  const handleSaveSuccess = (
    effectiveGameId: string,
    mode: "create" | "edit",
    memoId?: string
  ): void => {
    if (mode === "create") {
      if (isFromGame && gameIdParam) {
        // MemoCardから新規作成の場合は、ゲーム詳細ページに戻る
        navigate(`/game/${gameIdParam}`)
      } else {
        // その他の場合はメモ一覧に遷移
        navigate(`/memo/list/${effectiveGameId}`)
      }
    } else {
      // 編集の場合
      if (isFromGame && gameIdParam && memoId) {
        // MemoCardから編集の場合は、メモ閲覧ページに戻る
        navigate(`/memo/view/${memoId}?from=game&gameId=${gameIdParam}`)
      } else {
        // その他の場合はブラウザの戻る
        navigate(-1)
      }
    }
  }

  return {
    handleBack,
    handleSaveSuccess,
    searchParams,
    isFromGame,
    gameIdParam
  }
}
