/**
 * @fileoverview メモ作成・編集ページ
 *
 * 新しいメモの作成と既存メモの編集を行うページです。
 * @uiw/react-md-editorを使用してmarkdownでメモを作成・編集できます。
 */

import React from "react"
import { useParams } from "react-router-dom"
import { useMemoNavigation } from "@renderer/hooks/useMemoNavigation"
import MemoForm from "@renderer/components/MemoForm"

export default function MemoEditor(): React.JSX.Element {
  const { gameId, memoId } = useParams<{ gameId?: string; memoId?: string }>()
  const { handleBack, handleSaveSuccess } = useMemoNavigation()

  // パラメータによってモードを決定
  const mode = memoId ? "edit" : "create"
  const pageTitle = mode === "edit" ? "メモを編集" : "新しいメモ"

  return (
    <MemoForm
      mode={mode}
      memoId={memoId}
      preSelectedGameId={gameId}
      showGameSelector={false}
      pageTitle={pageTitle}
      backTo={handleBack}
      onSaveSuccess={(effectiveGameId) => handleSaveSuccess(effectiveGameId, mode, memoId)}
    />
  )
}
