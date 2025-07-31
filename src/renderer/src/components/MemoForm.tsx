/**
 * @fileoverview メモ作成・編集フォームコンポーネント
 *
 * メモの作成と編集に使用する共通フォームコンポーネントです。
 * ゲーム選択機能、MDエディター、保存機能を提供します。
 */

import MDEditor from "@uiw/react-md-editor"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { FaArrowLeft, FaSave, FaGamepad } from "react-icons/fa"
import { useNavigate } from "react-router-dom"

import { useToastHandler } from "@renderer/hooks/useToastHandler"

import { logger } from "@renderer/utils/logger"

import type { GameType } from "src/types/game"
import type { CreateMemoData, UpdateMemoData } from "src/types/memo"

import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

export type MemoFormProps = {
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
  const abortControllerRef = useRef<AbortController | null>(null)

  // データ取得
  const fetchData = useCallback(async () => {
    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    try {
      const promises: Promise<unknown>[] = []

      // ゲーム選択機能が有効な場合、ゲーム一覧を取得
      if (showGameSelector) {
        promises.push(
          window.api.database.listGames("", "all", "title").then((gameResult) => {
            if (controller.signal.aborted) return
            if (gameResult && Array.isArray(gameResult)) {
              // 型安全性の改善：GameType[]として明示的にキャスト
              const typedGames = gameResult as GameType[]
              const sortedGames = typedGames.sort((a, b) => a.title.localeCompare(b.title))
              setGames(sortedGames)

              // ゲームが1つしかない場合は自動選択
              if (sortedGames.length === 1 && !selectedGameId) {
                setSelectedGameId(sortedGames[0].id)
              }
            }
          })
        )
      }

      // 編集モードの場合、メモ情報を取得
      if (mode === "edit" && memoId) {
        promises.push(
          window.api.memo.getMemoById(memoId).then(async (memoResult) => {
            if (controller.signal.aborted) return
            if (memoResult.success && memoResult.data) {
              setTitle(memoResult.data.title)
              setContent(memoResult.data.content)

              // メモからゲーム情報を取得
              if (!selectedGameId && !preSelectedGameId) {
                const gameResult = await window.api.database.getGameById(memoResult.data.gameId)
                if (!controller.signal.aborted && gameResult) {
                  setGameTitle(gameResult.title)
                  setSelectedGameId(memoResult.data.gameId)
                }
              }
            } else {
              if (!controller.signal.aborted) {
                showToast("メモが見つかりません", "error")
              }
            }
          })
        )
      }

      // 特定のゲームが選択されている場合、ゲーム情報を取得
      const targetGameId = selectedGameId || preSelectedGameId
      if (targetGameId && mode !== "edit") {
        promises.push(
          window.api.database.getGameById(targetGameId).then((gameResult) => {
            if (controller.signal.aborted) return
            if (gameResult) {
              setGameTitle(gameResult.title)
              if (!selectedGameId) {
                setSelectedGameId(targetGameId)
              }
            }
          })
        )
      }

      // 並行実行
      await Promise.allSettled(promises)
    } catch (error) {
      if (!controller.signal.aborted) {
        logger.error("データ取得エラー:", {
          component: "MemoForm",
          function: "unknown",
          data: error
        })
        showToast("データの取得に失敗しました", "error")
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [selectedGameId, showToast, mode, memoId, preSelectedGameId, showGameSelector])

  useEffect(() => {
    fetchData()

    // クリーンアップで進行中のリクエストをキャンセル
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // 保存処理の最適化
  const saveData = useMemo(
    () => ({
      title: title.trim(),
      content: content || "",
      effectiveGameId: selectedGameId || preSelectedGameId
    }),
    [title, content, selectedGameId, preSelectedGameId]
  )

  // 表示用データの最適化
  const displayData = useMemo(
    () => ({
      effectiveGameId: selectedGameId || preSelectedGameId,
      displayGameTitle:
        gameTitle || games.find((g) => g.id === (selectedGameId || preSelectedGameId))?.title
    }),
    [selectedGameId, preSelectedGameId, gameTitle, games]
  )

  // 保存処理
  const handleSave = useCallback(
    async (closeAfterSave: boolean = true) => {
      // バリデーション
      if (!saveData.title) {
        showToast("タイトルを入力してください", "error")
        return
      }

      if (!saveData.effectiveGameId) {
        showToast("ゲームを選択してください", "error")
        return
      }

      if (saveData.title.length > 200) {
        showToast("タイトルは200文字以内で入力してください", "error")
        return
      }

      setIsSaving(true)
      try {
        let result

        if (mode === "create") {
          // 新規作成
          const createData: CreateMemoData = {
            title: saveData.title,
            content: saveData.content,
            gameId: saveData.effectiveGameId
          }

          result = await window.api.memo.createMemo(createData)
          if (result.success) {
            showToast("メモを作成しました", "success")
            if (closeAfterSave) {
              onSaveSuccess(saveData.effectiveGameId, result.data?.id)
            }
          } else {
            const errorMessage = result.message || "メモの作成に失敗しました"
            showToast(`作成エラー: ${errorMessage}`, "error")
          }
        } else if (mode === "edit" && memoId) {
          // 編集
          const updateData: UpdateMemoData = {
            title: saveData.title,
            content: saveData.content
          }

          result = await window.api.memo.updateMemo(memoId, updateData)
          if (result.success) {
            showToast("メモを更新しました", "success")
            if (closeAfterSave) {
              onSaveSuccess(saveData.effectiveGameId, memoId)
            }
          } else {
            const errorMessage = result.message || "メモの更新に失敗しました"
            showToast(`更新エラー: ${errorMessage}`, "error")
          }
        }
      } catch (error) {
        logger.error("保存エラー:", { component: "MemoForm", function: "unknown", data: error })
        const errorMessage = error instanceof Error ? error.message : "不明なエラー"
        showToast(`保存に失敗しました: ${errorMessage}`, "error")
      } finally {
        setIsSaving(false)
      }
    },
    [mode, saveData, memoId, showToast, onSaveSuccess]
  )

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
        // Ctrl+Sでは編集モードを閉じずに保存のみ実行
        handleSave(false)
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

  return (
    <div className="bg-base-200 px-4 sm:px-6 py-4">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button onClick={handleBack} className="btn btn-ghost btn-sm sm:btn-md">
            <FaArrowLeft />
            <span className="hidden sm:inline">戻る</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{pageTitle}</h1>
            {displayData.displayGameTitle && (
              <p className="text-sm sm:text-base text-base-content/70 truncate">
                {displayData.displayGameTitle}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving || !saveData.title || !displayData.effectiveGameId}
          className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
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
                    選択中: {displayData.displayGameTitle}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* タイトル入力 */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text text-lg font-semibold">タイトル</span>
              <span className="label-text-alt text-xs">
                <span
                  className={
                    title.length > 180
                      ? "text-warning"
                      : title.length > 190
                        ? "text-error"
                        : "text-base-content/60"
                  }
                >
                  {title.length}/200文字
                </span>
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="メモのタイトルを入力..."
              className={`input input-bordered w-full ${title.length > 190 ? "input-error" : ""}`}
              maxLength={200}
              disabled={isSaving}
            />
            {title.length > 190 && (
              <div className="label">
                <span className="label-text-alt text-error text-xs">
                  文字数制限に近づいています
                </span>
              </div>
            )}
          </div>

          {/* 内容入力 */}
          <div className="form-control">
            <div className="flex justify-between items-center mb-2">
              <label className="label-text text-lg font-semibold">内容</label>
              <div className="flex items-center gap-2">
                <span className="text-lm text-base-content/60">{content.length}文字</span>
              </div>
            </div>

            <div className="border border-base-300 rounded-lg overflow-hidden">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={550}
                visibleDragbar={false}
                data-color-mode="light"
                textareaProps={{
                  placeholder: "メモを記入してください！",
                  disabled: isSaving,
                  style: { fontSize: "14px", lineHeight: "1.6" }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
