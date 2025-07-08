/**
 * @fileoverview 章表示・変更カードコンポーネント
 *
 * 現在の章を表示し、章を変更するためのボタンを提供します。
 * 現在の章情報と章変更のためのUI要素を含みます。
 */

import { useState, useEffect, useCallback } from "react"
import { FaBook, FaChevronLeft, FaChevronRight, FaPlus, FaCog } from "react-icons/fa"
import { Chapter } from "../../../types/chapter"

interface ChapterDisplayCardProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** 現在の章ID */
  currentChapterId?: string
  /** 章設定ボタンクリック時のコールバック */
  onChapterSettings?: () => void
  /** 章追加ボタンクリック時のコールバック */
  onAddChapter?: () => void
  /** 章変更時のコールバック */
  onChapterChange?: () => void
}

/**
 * 章表示・変更カードコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns 章表示カードコンポーネント
 */
export default function ChapterDisplayCard({
  gameId,
  currentChapterId,
  onChapterSettings,
  onAddChapter,
  onChapterChange
}: ChapterDisplayCardProps): React.JSX.Element {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 章データを取得
  useEffect(() => {
    const fetchChapters = async (): Promise<void> => {
      if (!gameId) return

      try {
        setIsLoading(true)
        const result = await window.api.chapter.getChapters(gameId)

        if (result.success && result.data) {
          const sortedChapters = result.data.sort((a, b) => a.order - b.order)
          setChapters(sortedChapters)

          // 現在の章を設定
          if (currentChapterId) {
            const current = sortedChapters.find((c) => c.id === currentChapterId)
            setCurrentChapter(current || (sortedChapters.length > 0 ? sortedChapters[0] : null))
          } else {
            setCurrentChapter(sortedChapters.length > 0 ? sortedChapters[0] : null)
          }
        } else {
          console.error("章データの取得に失敗:", result.success ? "データが空です" : result.message)
          setChapters([])
          setCurrentChapter(null)
        }
      } catch (error) {
        console.error("章データの取得に失敗:", error)
        setChapters([])
        setCurrentChapter(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapters()
  }, [gameId, currentChapterId])

  // 前の章に移動
  const goToPreviousChapter = useCallback(async () => {
    if (!currentChapter || chapters.length === 0) return

    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id)
    if (currentIndex > 0) {
      const previousChapter = chapters[currentIndex - 1]

      try {
        // サーバー側で現在の章を更新
        const result = await window.api.chapter.setCurrentChapter(gameId, previousChapter.id)
        if (result.success) {
          setCurrentChapter(previousChapter)
          onChapterChange?.()
        } else {
          console.error("章の変更に失敗:", result.message)
        }
      } catch (error) {
        console.error("章の変更に失敗:", error)
      }
    }
  }, [currentChapter, chapters, gameId, onChapterChange])

  // 次の章に移動
  const goToNextChapter = useCallback(async () => {
    if (!currentChapter || chapters.length === 0) return

    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id)
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1]

      try {
        // サーバー側で現在の章を更新
        const result = await window.api.chapter.setCurrentChapter(gameId, nextChapter.id)
        if (result.success) {
          setCurrentChapter(nextChapter)
          onChapterChange?.()
        } else {
          console.error("章の変更に失敗:", result.message)
        }
      } catch (error) {
        console.error("章の変更に失敗:", error)
      }
    }
  }, [currentChapter, chapters, gameId, onChapterChange])

  // 章を直接選択
  const selectChapter = useCallback(
    async (chapter: Chapter) => {
      try {
        // サーバー側で現在の章を更新
        const result = await window.api.chapter.setCurrentChapter(gameId, chapter.id)
        if (result.success) {
          setCurrentChapter(chapter)
          onChapterChange?.()
        } else {
          console.error("章の変更に失敗:", result.message)
        }
      } catch (error) {
        console.error("章の変更に失敗:", error)
      }
    },
    [gameId, onChapterChange]
  )

  if (isLoading) {
    return (
      <div className="bg-base-200 p-4 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      </div>
    )
  }

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter?.id)
  const isFirstChapter = currentIndex === 0
  const isLastChapter = currentIndex === chapters.length - 1

  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaBook className="text-info" />
            <h4 className="font-semibold">現在の章</h4>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={onChapterSettings}>
              <FaCog />
              章設定
            </button>
            <button className="btn btn-primary btn-sm" onClick={onAddChapter}>
              <FaPlus />
              章追加
            </button>
          </div>
        </div>
        {/* 現在の章表示 */}
        <div className="bg-base-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            {/* 前の章ボタン */}
            <button
              className={`btn btn-ghost btn-sm ${isFirstChapter ? "btn-disabled" : ""}`}
              onClick={goToPreviousChapter}
              disabled={isFirstChapter}
            >
              <FaChevronLeft />
            </button>
            {/* 現在の章情報 */}
            <div className="text-center flex-1">
              <div className="text-sm text-base-content/60">
                {currentIndex + 1} / {chapters.length}
              </div>
              <div className="text-xl font-bold">{currentChapter?.name}</div>
            </div>
            {/* 次の章ボタン */}
            <button
              className={`btn btn-ghost btn-sm ${isLastChapter ? "btn-disabled" : ""}`}
              onClick={goToNextChapter}
              disabled={isLastChapter}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        {/* 章一覧 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-base-content/80 mb-2">章一覧</div>
          <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent space-y-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                className={`btn btn-ghost btn-sm w-full justify-start ${
                  currentChapter?.id === chapter.id ? "btn-active" : ""
                }`}
                onClick={() => selectChapter(chapter)}
              >
                <span className="flex-1 text-left">
                  {chapter.order}. {chapter.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* 章追加ボタン */}
        <div className="mt-4 pt-4 border-t border-base-300"></div>
      </div>
    </div>
  )
}
