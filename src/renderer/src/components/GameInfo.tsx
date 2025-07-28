/**
 * @fileoverview ゲーム情報表示コンポーネント
 *
 * このコンポーネントは、ゲームの基本情報（タイトル、パブリッシャー、画像、説明など）を表示します。
 * 主な機能：
 * - ゲーム基本情報の表示
 * - プレイステータス表示
 * - 動的画像読み込み
 * - メモ化による最適化
 */

import { memo } from "react"

import { useTimeFormat } from "@renderer/hooks/useTimeFormat"

import DynamicImage from "./DynamicImage"
import GameActionButtons from "./GameActionButtons"
import PlayStatusSelector from "./PlayStatusSelector"
import type { GameType } from "src/types/game"

interface GameInfoProps {
  /** ゲーム情報 */
  game: GameType
  /** プレイステータス更新中フラグ */
  isUpdatingStatus: boolean
  /** 起動中フラグ */
  isLaunching?: boolean
  /** プレイステータス変更ハンドラ */
  onStatusChange: (status: string) => void
  /** ゲーム起動ハンドラ */
  onLaunchGame: () => void
  /** ゲーム編集ハンドラ */
  onEditGame: () => void
  /** ゲーム削除ハンドラ */
  onDeleteGame: () => void
}

/**
 * ゲーム情報表示コンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns ゲーム情報表示要素
 */
const GameInfo = memo(function GameInfo({
  game,
  isUpdatingStatus,
  isLaunching,
  onStatusChange,
  onLaunchGame,
  onEditGame,
  onDeleteGame
}: GameInfoProps): React.JSX.Element {
  const { formatSmart, formatDateWithTime } = useTimeFormat()

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左：サムネイル */}
          <figure className="flex-shrink-0 w-full lg:w-80 aspect-[4/3] bg-base-200 rounded-lg overflow-hidden">
            <DynamicImage
              src={game.imagePath || ""}
              alt={game.title}
              className="w-full h-full object-contain text-black"
            />
          </figure>

          {/* 右：情報＆アクション */}
          <div className="flex-1 flex flex-col justify-between">
            {/* ゲーム情報 */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
              <p className="text-lg text-base-content/70 mb-4">{game.publisher}</p>

              {/* プレイステータス */}
              <div className="mb-4">
                <PlayStatusSelector
                  currentStatus={game.playStatus}
                  onStatusChange={onStatusChange}
                  disabled={isUpdatingStatus}
                />
              </div>

              {/* メタ情報 */}
              <div className="flex flex-wrap text-sm text-base-content/60 gap-4 mb-6">
                <span>
                  最終プレイ: {game.lastPlayed ? formatDateWithTime(game.lastPlayed) : "なし"}
                </span>
                <span>総プレイ時間: {formatSmart(game.totalPlayTime ?? 0)}</span>
                {game.playStatus === "played" && game.clearedAt && (
                  <span>クリア日時: {formatDateWithTime(game.clearedAt)}</span>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="mt-4">
              <GameActionButtons
                gameId={game.id}
                saveDataFolderPath={game.saveFolderPath}
                onLaunchGame={onLaunchGame}
                onEditGame={onEditGame}
                onDeleteGame={onDeleteGame}
                isLaunching={isLaunching}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GameInfo
