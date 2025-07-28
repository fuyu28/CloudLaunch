/**
 * @fileoverview 汎用メモ作成ページ
 *
 * サイドメニューからアクセスできる汎用のメモ作成ページです。
 * ゲーム選択機能付きで、任意のゲームに対してメモを作成できます。
 */

import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import MemoForm from "@renderer/components/MemoForm"

export default function MemoCreate(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preSelectedGameId = searchParams.get("gameId")

  return (
    <MemoForm
      mode="create"
      preSelectedGameId={preSelectedGameId || undefined}
      showGameSelector={true}
      pageTitle="新しいメモを作成"
      backTo="/"
      onSaveSuccess={(gameId) => {
        navigate(`/memo/list/${gameId}`)
      }}
    />
  )
}
