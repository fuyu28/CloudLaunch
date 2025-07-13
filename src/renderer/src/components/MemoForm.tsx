/**
 * @fileoverview メモ作成・編集フォームコンポーネント
 *
 * メモの作成と編集に使用する共通フォームコンポーネントです。
 * ゲーム選択機能、MDエディター、保存機能を提供します。
 */

import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import MDEditor from "@uiw/react-md-editor"
import { FaArrowLeft, FaSave, FaGamepad } from "react-icons/fa"
import { useToastHandler } from "@renderer/hooks/useToastHandler"
import type { CreateMemoData, UpdateMemoData } from "src/types/memo"
import type { GameType } from "src/types/game"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

export interface MemoFormProps {
  /** フォームのモード */
  mode: "create" | "edit"
  /** 編集時のメモID */
  memoId?: string
  /** 事前選択されたゲームID */
  preSelectedGameId?: string
  /** ゲーム選択を表示するかどうか */
  showGameSelector?: boolean
  /** ページタイトル */
  pageTitle: string
  /** 戻るボタンの遷移先 */
  backTo: string | (() => void)
  /** 保存成功時の遷移先 */
  onSaveSuccess: (gameId: string, memoId?: string) => void
}

export default function MemoForm({
  mode,
  memoId,
  preSelectedGameId,
  showGameSelector = false,
  pageTitle,
  backTo,
  onSaveSuccess
}: MemoFormProps): React.JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToastHandler()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedGameId, setSelectedGameId] = useState<string>(preSelectedGameId || "")
  const [gameTitle, setGameTitle] = useState("")
  const [games, setGames] = useState<GameType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // ゲーム選択機能が有効な場合、ゲーム一覧を取得
      if (showGameSelector) {
        const gameResult = await window.api.database.listGames("", "all", "title")
        if (gameResult) {
          const sortedGames = gameResult.sort((a, b) => a.title.localeCompare(b.title))
          setGames(sortedGames as GameType[])

          // ゲームが1つしかない場合は自動選択
          if (sortedGames.length === 1 && !selectedGameId) {
            setSelectedGameId(sortedGames[0].id)
          }
        }
      }

      // 特定のゲームが選択されている場合、ゲーム情報を取得
      if (selectedGameId || preSelectedGameId) {
        const gameId = selectedGameId || preSelectedGameId!
        const gameResult = await window.api.database.getGameById(gameId)
        if (gameResult) {
          setGameTitle(gameResult.title)
          if (!selectedGameId) {
            setSelectedGameId(gameId)
          }
        }
      }

      // 編集モードの場合、メモ情報を取得
      if (mode === "edit" && memoId) {
        const memoResult = await window.api.memo.getMemoById(memoId)
        if (memoResult.success && memoResult.data) {
          setTitle(memoResult.data.title)
          setContent(memoResult.data.content)

          // メモからゲーム情報を取得（まだ取得していない場合）
          if (!selectedGameId && !preSelectedGameId) {
            const gameResult = await window.api.database.getGameById(memoResult.data.gameId)
            if (gameResult) {
              setGameTitle(gameResult.title)
              setSelectedGameId(memoResult.data.gameId)
            }
          }
        } else {
          showToast("メモが見つかりません", "error")
          return
        }
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      showToast("データの取得に失敗しました", "error")
    } finally {
      setIsLoading(false)
    }
  }, [mode, memoId, selectedGameId, preSelectedGameId, showGameSelector, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      showToast("タイトルを入力してください", "error")
      return
    }

    const effectiveGameId = selectedGameId || preSelectedGameId
    if (!effectiveGameId) {
      showToast("ゲームを選択してください", "error")
      return
    }

    setIsSaving(true)
    try {
      if (mode === "create") {
        // 新規作成
        const createData: CreateMemoData = {
          title: title.trim(),
          content: content || "",
          gameId: effectiveGameId
        }

        const result = await window.api.memo.createMemo(createData)
        if (result.success) {
          showToast("メモを作成しました", "success")
          onSaveSuccess(effectiveGameId, result.data?.id)
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
          onSaveSuccess(effectiveGameId, memoId)
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
  }, [mode, title, content, selectedGameId, preSelectedGameId, memoId, showToast, onSaveSuccess])

  // 戻るボタン処理
  const handleBack = useCallback(() => {
    if (typeof backTo === "function") {
      backTo()
    } else {
      navigate(backTo)
    }
  }, [navigate, backTo])

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

  // ゲーム選択が有効でゲームが登録されていない場合
  if (showGameSelector && games.length === 0) {
    return (
      <div className="bg-base-200 px-6 py-4 min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="card bg-base-100 shadow-xl max-w-md">
            <div className="card-body text-center">
              <FaGamepad className="text-6xl text-base-content/50 mx-auto mb-4" />
              <h2 className="card-title justify-center text-xl">ゲームが登録されていません</h2>
              <p className="text-base-content/70">
                メモを作成するには、まずゲームを登録してください。
              </p>
              <div className="card-actions justify-center mt-4">
                <button onClick={handleBack} className="btn btn-outline">
                  <FaArrowLeft />
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const effectiveGameId = selectedGameId || preSelectedGameId
  const displayGameTitle = gameTitle || games.find((g) => g.id === effectiveGameId)?.title

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
            {pageTitle}
            {displayGameTitle && (
              <span className="text-lg text-base-content/70 ml-2">- {displayGameTitle}</span>
            )}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim() || !effectiveGameId}
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
          {/* ゲーム選択 */}
          {showGameSelector && (
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-lg font-semibold">
                  <FaGamepad className="inline mr-2" />
                  ゲーム選択
                </span>
              </label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="select select-bordered w-full"
                disabled={isSaving}
              >
                <option value="">ゲームを選択してください</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                    {game.publisher && ` (${game.publisher})`}
                  </option>
                ))}
              </select>
              {selectedGameId && (
                <div className="label">
                  <span className="label-text-alt text-success">
                    選択中: {games.find((g) => g.id === selectedGameId)?.title}
                  </span>
                </div>
              )}
            </div>
          )}

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
              disabled={isSaving}
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
                    "メモをmarkdownで記入してください...\n\n基本的なMarkdown記法:\n# 見出し1\n## 見出し2\n**太字** または __太字__\n*斜体* または _斜体_\n- リスト項目\n1. 番号付きリスト\n> 引用文\n`コード` または\n```\nコードブロック\n```\n[リンクテキスト](URL)",
                  disabled: isSaving
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
