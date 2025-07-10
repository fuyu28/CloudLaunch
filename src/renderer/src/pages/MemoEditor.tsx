/**
 * @fileoverview メモ作成・編集ページ
 *
 * 新しいメモの作成と既存メモの編集を行うページです。
 * @uiw/react-md-editorを使用してmarkdownでメモを作成・編集できます。
 */

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import MDEditor from "@uiw/react-md-editor"
import { FaArrowLeft, FaSave } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import { CreateMemoData, UpdateMemoData } from "src/preload/preload"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

export default function MemoEditor(): React.JSX.Element {
  const { gameId, memoId } = useParams<{ gameId?: string; memoId?: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastHandler()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [gameTitle, setGameTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // ゲーム情報を取得
      if (gameId) {
        const gameResult = await window.api.database.getGameById(gameId)
        if (gameResult) {
          setGameTitle(gameResult.title)
        }
      }

      // 編集モードの場合、メモ情報を取得
      if (memoId) {
        setMode("edit")
        const memoResult = await window.api.memo.getMemoById(memoId)
        if (memoResult.success && memoResult.data) {
          setTitle(memoResult.data.title)
          setContent(memoResult.data.content)
          // 編集モードではメモからゲームIDを取得
          if (!gameId) {
            const gameResult = await window.api.database.getGameById(memoResult.data.gameId)
            if (gameResult) {
              setGameTitle(gameResult.title)
            }
          }
        } else {
          showToast("メモが見つかりません", "error")
          navigate(-1)
          return
        }
      } else if (gameId) {
        setMode("create")
      } else {
        showToast("ゲームIDまたはメモIDが必要です", "error")
        navigate("/")
        return
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      showToast("データの取得に失敗しました", "error")
    } finally {
      setIsLoading(false)
    }
  }, [gameId, memoId, showToast, navigate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      showToast("タイトルを入力してください", "error")
      return
    }

    setIsSaving(true)
    try {
      if (mode === "create" && gameId) {
        // 新規作成
        const createData: CreateMemoData = {
          title: title.trim(),
          content: content || "",
          gameId: gameId
        }

        const result = await window.api.memo.createMemo(createData)
        if (result.success) {
          showToast("メモを作成しました", "success")
          navigate(`/memo/list/${gameId}`)
        } else {
          showToast(result.message || "メモの作成に失敗しました", "error")
        }
      } else if (mode === "edit" && memoId) {
        // 編集
        const updateData: UpdateMemoData = {
          title: title.trim(),
          content: content || ""
        }

        const result = await window.api.memo.updateMemo(memoId, updateData)
        if (result.success) {
          showToast("メモを更新しました", "success")
          navigate(-1)
        } else {
          showToast(result.message || "メモの更新に失敗しました", "error")
        }
      }
    } catch (error) {
      console.error("保存エラー:", error)
      showToast("保存に失敗しました", "error")
    } finally {
      setIsSaving(false)
    }
  }, [mode, title, content, gameId, memoId, showToast, navigate])

  // 戻るボタン処理
  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
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
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "新しいメモ" : "メモを編集"}
            {gameTitle && <span className="text-lg text-base-content/70 ml-2">- {gameTitle}</span>}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="btn btn-primary"
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              保存中...
            </>
          ) : (
            <>
              <FaSave />
              保存
            </>
          )}
        </button>
      </div>

      {/* メモ入力フォーム */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* タイトル入力 */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text text-lg font-semibold">タイトル</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="メモのタイトルを入力..."
              className="input input-bordered w-full"
              maxLength={200}
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">{title.length}/200文字</span>
            </div>
          </div>

          {/* 内容入力 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">内容</span>
            </label>
            <div className="markdown-editor-wrapper">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={400}
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    "メモをmarkdownで記入してください...\n\n基本的なMarkdown記法:\n# 見出し1\n## 見出し2\n**太字** または __太字__\n*斜体* または _斜体_\n- リスト項目\n1. 番号付きリスト\n> 引用文\n`コード` または\n```\nコードブロック\n```\n[リンクテキスト](URL)"
                }}
              />
            </div>
          </div>

          {/* ショートカットヒント */}
          <div className="text-sm text-base-content/60 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p>💡 Ctrl+S で保存</p>
              <p>👁️ プレビューボタンで表示確認</p>
            </div>
            <div className="mt-2 p-3 bg-base-200 rounded">
              <p className="text-xs font-semibold mb-1">Markdown記法例:</p>
              <p className="text-xs">**太字** *斜体* `コード` # 見出し - リスト &gt; 引用</p>
              <p className="text-xs mt-1">
                Ctrl+A（全選択）、Ctrl+C（コピー）、Ctrl+V（貼り付け）使用可能
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
