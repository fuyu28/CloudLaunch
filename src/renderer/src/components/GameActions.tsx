/**
 * @fileoverview ゲームアクションコンポーネント
 *
 * このコンポーネントは、ゲームに対する各種アクション（起動、編集、削除など）を提供します。
 * 主な機能：
 * - ゲーム起動ボタン
 * - ゲーム編集ボタン
 * - ゲーム削除ボタン
 * - プレイセッション管理ボタン
 * - クラウド機能ボタン
 * - メモ化による最適化
 */

import { memo, useCallback } from "react"

import GameActionButtons from "./GameActionButtons"
import type { GameType } from "src/types/game"

interface GameActionsProps {
  /** ゲーム情報 */
  game: GameType
  /** オフラインモードフラグ */
  isOfflineMode: boolean
  /** 有効な認証情報フラグ */
  isValidCreds: boolean
  /** ゲーム起動ハンドラ */
  onLaunchGame: (exePath: string) => void
  /** ゲーム編集ハンドラ */
  onEditGame: () => void
  /** ゲーム削除ハンドラ */
  onDeleteGame: () => void
  /** プレイセッション管理ハンドラ */
  onOpenPlaySession: () => void
  /** クラウドアップロードハンドラ */
  onUploadToCloud: () => void
  /** クラウドダウンロードハンドラ */
  onDownloadFromCloud: () => void
}

/**
 * ゲームアクションコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns ゲームアクション要素
 */
const GameActions = memo(function GameActions({
  game,
  isOfflineMode,
  isValidCreds,
  onLaunchGame,
  onEditGame,
  onDeleteGame,
  onOpenPlaySession,
  onUploadToCloud,
  onDownloadFromCloud
}: GameActionsProps): React.JSX.Element {
  const handleLaunchGame = useCallback(() => {
    onLaunchGame(game.exePath)
  }, [game.exePath, onLaunchGame])

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">アクション</h2>

      <GameActionButtons
        gameId={game.id}
        saveDataFolderPath={game.saveFolderPath}
        onLaunchGame={handleLaunchGame}
        onEditGame={onEditGame}
        onDeleteGame={onDeleteGame}
        onOpenPlaySession={onOpenPlaySession}
        onUploadToCloud={isOfflineMode || !isValidCreds ? undefined : onUploadToCloud}
        onDownloadFromCloud={isOfflineMode || !isValidCreds ? undefined : onDownloadFromCloud}
      />

      {/* オフライン・認証状態の警告 */}
      {(isOfflineMode || !isValidCreds) && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm text-warning">
            {isOfflineMode
              ? "オフラインモードのため、クラウド機能は利用できません。"
              : "認証情報が無効なため、クラウド機能は利用できません。"}
          </p>
        </div>
      )}
    </div>
  )
})

export default GameActions
