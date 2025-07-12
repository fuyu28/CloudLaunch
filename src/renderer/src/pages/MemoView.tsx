/**
 * @fileoverview メモ閲覧ページ
 *
 * 既存のメモを読み取り専用で表示するページです。
 * react-markdownを使用してmarkdownを適切にレンダリングします。
 */

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { FaArrowLeft, FaEdit, FaTrash, FaExternalLinkAlt } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { useTimeFormat } from "@renderer/hooks/useTimeFormat"
import { MemoType } from "src/preload/preload"

export default function MemoView(): React.JSX.Element {
  const { memoId } = useParams<{ memoId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToastHandler()
  const { formatDateWithTime } = useTimeFormat()

  const [memo, setMemo] = useState<MemoType | null>(null)
  const [gameTitle, setGameTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // メモデータを取得
  const fetchMemo = useCallback(async () => {
    if (!memoId) return

    setIsLoading(true)
    try {
      const memoResult = await window.api.memo.getMemoById(memoId)
      if (memoResult.success && memoResult.data) {
        setMemo(memoResult.data)

        // ゲーム情報も取得
        const gameResult = await window.api.database.getGameById(memoResult.data.gameId)
        if (gameResult) {
          setGameTitle(gameResult.title)
        }
      } else {
        showToast("メモが見つかりません", "error")
        navigate(-1)
      }
    } catch (error) {
      console.error("メモ取得エラー:", error)
      showToast("メモの取得に失敗しました", "error")
      navigate(-1)
    } finally {
      setIsLoading(false)
    }
  }, [memoId, showToast, navigate])

  useEffect(() => {
    fetchMemo()
  }, [fetchMemo])

  // メモ削除処理
  const handleDeleteMemo = useCallback(async () => {
    if (!memo) return

    try {
      const result = await window.api.memo.deleteMemo(memo.id)
      if (result.success) {
        showToast("メモを削除しました", "success")
        navigate(`/memo/list/${memo.gameId}`)
      } else {
        showToast(result.message || "メモの削除に失敗しました", "error")
      }
    } catch (error) {
      console.error("メモ削除エラー:", error)
      showToast("メモの削除に失敗しました", "error")
    }
    setShowDeleteModal(false)
  }, [memo, showToast, navigate])

  // 戻るボタン処理
  const handleBack = useCallback(() => {
    const fromParam = searchParams.get("from")
    const gameIdParam = searchParams.get("gameId")

    if (fromParam === "game" && gameIdParam) {
      // MemoCardから来た場合は、ゲーム詳細ページに戻る
      navigate(`/game/${gameIdParam}`)
    } else if (memo) {
      // その他の場合は、メモリストに戻る
      navigate(`/memo/list/${memo.gameId}`)
    } else {
      // フォールバック: ブラウザの戻る
      navigate(-1)
    }
  }, [navigate, memo, searchParams])

  // メモファイルを開く処理
  const handleOpenMemoFile = useCallback(async () => {
    if (!memo) return

    try {
      const result = await window.api.memo.getMemoFilePath(memo.id)
      if (result.success && result.data) {
        await window.api.window.openFolder(result.data)
        showToast("メモファイルを開きました", "success")
      } else {
        showToast("メモファイルの取得に失敗しました", "error")
      }
    } catch (error) {
      console.error("ファイル操作エラー:", error)
      showToast("ファイルを開けませんでした", "error")
    }
  }, [memo, showToast])

  if (!memoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-error">メモIDが指定されていません</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!memo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-error">メモが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="bg-base-200 px-6 py-4 min-h-screen">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="btn btn-ghost">
            <FaArrowLeft />
            戻る
          </button>
          <div>
            <h1 className="text-2xl font-bold">{memo.title}</h1>
            {gameTitle && <p className="text-base-content/70">ゲーム: {gameTitle}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleOpenMemoFile} className="btn btn-outline">
            <FaExternalLinkAlt />
            ファイルを開く
          </button>
          <Link to={`/memo/edit/${memo.id}?${searchParams.toString()}`} className="btn btn-outline">
            <FaEdit />
            編集
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-outline btn-error">
            <FaTrash />
            削除
          </button>
        </div>
      </div>

      {/* メモ本体 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* メタ情報 */}
          <div className="flex justify-between text-sm text-base-content/60 mb-6 border-b border-base-300 pb-4">
            <div>作成日時: {formatDateWithTime(memo.createdAt)}</div>
            {memo.updatedAt !== memo.createdAt && (
              <div>更新日時: {formatDateWithTime(memo.updatedAt)}</div>
            )}
          </div>

          {/* マークダウンコンテンツ */}
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                // カスタムスタイリング
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mt-6 mb-4 text-base-content">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mt-5 mb-3 text-base-content">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold mt-4 mb-2 text-base-content">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 text-base-content leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside mb-4 text-base-content ml-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside mb-4 text-base-content ml-6">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-base-content/80">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isInline = !className
                  return isInline ? (
                    <code className="bg-base-200 px-1 py-0.5 rounded text-sm font-mono text-base-content">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-base-200 p-4 rounded text-sm font-mono text-base-content overflow-x-auto">
                      {children}
                    </code>
                  )
                },
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-base-content">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-base-content">{children}</em>
              }}
            >
              {memo.content || "*内容がありません*"}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">メモの削除</h3>
            <p className="py-4">「{memo.title}」を削除しますか？この操作は取り消せません。</p>
            <div className="modal-action">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost">
                キャンセル
              </button>
              <button onClick={handleDeleteMemo} className="btn btn-error">
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
