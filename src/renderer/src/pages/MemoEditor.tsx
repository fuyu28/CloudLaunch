/**
 * @fileoverview メモ作成・編集ページ
 *
 * 新しいメモの作成と既存メモの編集を行うページです。
 * @uiw/react-md-editorを使用してmarkdownでメモを作成・編集できます。
 */

import React from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import MemoForm from "@renderer/components/MemoForm"

export default function MemoEditor(): React.JSX.Element {
  const { gameId, memoId } = useParams<{ gameId?: string; memoId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // パラメータによってモードを決定
  const mode = memoId ? "edit" : "create"
  const pageTitle = mode === "edit" ? "メモを編集" : "新しいメモ"

  // 戻る処理を定義
  const handleBack = (): void => {
    const fromParam = searchParams.get("from")
    const gameIdParam = searchParams.get("gameId")

    if (fromParam === "game" && gameIdParam) {
      // MemoCardから来た場合は、ゲーム詳細ページに戻る
      navigate(`/game/${gameIdParam}`)
    } else {
      // その他の場合は、ブラウザの戻る
      navigate(-1)
    }
  }

  // 保存成功時の処理を定義
  const handleSaveSuccess = (effectiveGameId: string): void => {
    const fromParam = searchParams.get("from")
    const gameIdParam = searchParams.get("gameId")

    if (mode === "create") {
      if (fromParam === "game" && gameIdParam) {
        // MemoCardから新規作成の場合は、ゲーム詳細ページに戻る
        navigate(`/game/${gameIdParam}`)
      } else {
        navigate(`/memo/list/${effectiveGameId}`)
      }
    } else {
      // 編集の場合
      if (fromParam === "game" && gameIdParam) {
        // MemoCardから編集の場合は、メモ閲覧ページに戻る
        navigate(`/memo/view/${memoId}?from=game&gameId=${gameIdParam}`)
      } else {
        navigate(-1)
      }
    }
  }

  return (
    <MemoForm
      mode={mode}
      memoId={memoId}
      preSelectedGameId={gameId}
      showGameSelector={false}
      pageTitle={pageTitle}
      backTo={handleBack}
      onSaveSuccess={handleSaveSuccess}
    />
  )
}
