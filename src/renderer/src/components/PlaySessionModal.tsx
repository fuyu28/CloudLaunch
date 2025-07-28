/**
 * @fileoverview プレイセッション追加モーダルコンポーネント
 *
 * このコンポーネントは、ゲームのプレイセッションを追加するためのモーダルを提供します。
 *
 * 主な機能：
 * - 手動追加モード: 時間、分、秒を入力してプレイセッションを追加
 * - タイマーモード: リアルタイムでプレイ時間を計測してプレイセッションを追加
 * - タイマー操作: スタート、ストップ、再開、終了の機能
 * - 入力値の検証とエラーハンドリング
 *
 * 使用例：
 * ```tsx
 * <PlaySessionModal
 *   isOpen={isModalOpen}
 *   onClose={handleCloseModal}
 *   onSubmit={handleAddSession}
 *   gameTitle="ゲーム名"
 * />
 * ```
 */

import { useTimeFormat, timeUtils } from "@renderer/hooks/useTimeFormat"
import { useState, useEffect, useRef } from "react"
import { FaClock, FaEdit, FaPlay, FaStop, FaCheck, FaTimes } from "react-icons/fa"

/**
 * プレイセッション追加モーダルのprops
 */
export interface PlaySessionModalProps {
  /** モーダルが開いているかどうか */
  isOpen: boolean
  /** モーダルを閉じる時のコールバック */
  onClose: () => void
  /** プレイセッションを追加する時のコールバック */
  onSubmit: (duration: number, sessionName?: string) => Promise<void>
  /** ゲームのタイトル */
  gameTitle: string
}

/**
 * モーダルのモード（手動追加 or タイマー）
 */
type ModalMode = "manual" | "timer"

/**
 * タイマーの状態
 */
type TimerState = "stopped" | "running" | "paused"

/**
 * プレイセッション追加モーダルコンポーネント
 *
 * 手動追加とタイマー追加の2つのモードを提供し、
 * ユーザーがゲームのプレイセッションを記録できます。
 *
 * @param props コンポーネントのprops
 * @returns プレイセッション追加モーダル要素
 */
export function PlaySessionModal({
  isOpen,
  onClose,
  onSubmit,
  gameTitle
}: PlaySessionModalProps): React.JSX.Element {
  const [mode, setMode] = useState<ModalMode>("manual")
  const [hoursInput, setHoursInput] = useState<string>("")
  const [minutesInput, setMinutesInput] = useState<string>("")
  const [secondsInput, setSecondsInput] = useState<string>("")
  const [sessionName, setSessionName] = useState<string>("")
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [timerState, setTimerState] = useState<TimerState>("stopped")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const { formatShort } = useTimeFormat()

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (isOpen) {
      setMode("manual")
      setHoursInput("")
      setMinutesInput("")
      setSecondsInput("")
      setSessionName("")
      setTimerSeconds(0)
      setTimerState("stopped")
      setError("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  // タイマー処理
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState])

  /**
   * 入力値を数値に変換（空文字列の場合は0）
   */
  const parseInputValue = (value: string): number => {
    const parsed = parseInt(value)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * 手動追加フォームのバリデーション
   * @returns バリデーション結果
   */
  const validateManualInput = (): boolean => {
    const hours = parseInputValue(hoursInput)
    const minutes = parseInputValue(minutesInput)
    const seconds = parseInputValue(secondsInput)
    const totalSeconds = timeUtils.toSeconds(hours, minutes, seconds)
    if (totalSeconds <= 0) {
      setError("プレイ時間は1秒以上で入力してください")
      return false
    }
    if (totalSeconds > 86400) {
      // 24時間制限
      setError("プレイ時間は24時間以内で入力してください")
      return false
    }
    return true
  }

  /**
   * タイマー開始処理
   */
  const handleStartTimer = (): void => {
    setTimerState("running")
    setError("")
  }

  /**
   * タイマー停止処理
   */
  const handleStopTimer = (): void => {
    setTimerState("paused")
  }

  /**
   * タイマー再開処理
   */
  const handleResumeTimer = (): void => {
    setTimerState("running")
  }

  /**
   * プレイセッション追加処理
   */
  const handleSubmitSession = async (): Promise<void> => {
    setIsSubmitting(true)
    setError("")

    try {
      let duration: number

      if (mode === "manual") {
        if (!validateManualInput()) {
          setIsSubmitting(false)
          return
        }
        const hours = parseInputValue(hoursInput)
        const minutes = parseInputValue(minutesInput)
        const seconds = parseInputValue(secondsInput)
        duration = timeUtils.toSeconds(hours, minutes, seconds)
      } else {
        if (timerSeconds <= 0) {
          setError("タイマーを開始してからセッションを追加してください")
          setIsSubmitting(false)
          return
        }
        duration = timerSeconds
      }

      await onSubmit(duration, sessionName.trim() || undefined)
      onClose()
    } catch {
      setError("プレイセッションの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * モーダルを閉じる処理
   */
  const handleClose = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    onClose()
  }

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">プレイセッション追加 - {gameTitle}</h3>

        {/* モード選択タブ */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab tab-lg flex-1 ${mode === "manual" ? "tab-active" : ""}`}
            onClick={() => setMode("manual")}
          >
            <FaEdit className="mr-2" />
            手動追加
          </button>
          <button
            className={`tab tab-lg flex-1 ${mode === "timer" ? "tab-active" : ""}`}
            onClick={() => setMode("timer")}
          >
            <FaClock className="mr-2" />
            タイマー
          </button>
        </div>

        {/* セッション名入力欄（共通） */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">セッション名（任意）</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="例: 第1章クリア, ボス戦, 探索タイム"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt">
              セッションに名前を付けることで、後で振り返りやすくなります
            </span>
          </label>
        </div>

        {/* 手動追加モード */}
        {mode === "manual" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">時間</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={hoursInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d+$/.test(value)) {
                      const numValue = value === "" ? 0 : parseInt(value)
                      if (numValue >= 0 && numValue <= 23) {
                        setHoursInput(value)
                      }
                    }
                  }}
                  min="0"
                  max="23"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">分</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={minutesInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d+$/.test(value)) {
                      const numValue = value === "" ? 0 : parseInt(value)
                      if (numValue >= 0 && numValue <= 59) {
                        setMinutesInput(value)
                      }
                    }
                  }}
                  min="0"
                  max="59"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">秒</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={secondsInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d+$/.test(value)) {
                      const numValue = value === "" ? 0 : parseInt(value)
                      if (numValue >= 0 && numValue <= 59) {
                        setSecondsInput(value)
                      }
                    }
                  }}
                  min="0"
                  max="59"
                />
              </div>
            </div>
            <div className="text-center text-lg font-mono">
              合計時間:{" "}
              {formatShort(
                timeUtils.toSeconds(
                  parseInputValue(hoursInput),
                  parseInputValue(minutesInput),
                  parseInputValue(secondsInput)
                )
              )}
            </div>
          </div>
        )}

        {/* タイマーモード */}
        {mode === "timer" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-primary">
                {formatShort(timerSeconds)}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {timerState === "stopped" && (
                <button className="btn btn-primary btn-lg" onClick={handleStartTimer}>
                  <FaPlay className="mr-2" />
                  スタート
                </button>
              )}

              {timerState === "running" && (
                <button className="btn btn-warning btn-lg" onClick={handleStopTimer}>
                  <FaStop className="mr-2" />
                  ストップ
                </button>
              )}

              {timerState === "paused" && (
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-lg" onClick={handleResumeTimer}>
                    <FaPlay className="mr-2" />
                    再開
                  </button>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleSubmitSession}
                    disabled={isSubmitting}
                  >
                    <FaCheck className="mr-2" />
                    終了
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="alert alert-error mt-4">
            <FaTimes className="mr-2" />
            {error}
          </div>
        )}

        {/* アクションボタン */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </button>
          {mode === "manual" && (
            <button
              className="btn btn-primary"
              onClick={handleSubmitSession}
              disabled={isSubmitting}
            >
              {isSubmitting ? "追加中..." : "追加"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaySessionModal
