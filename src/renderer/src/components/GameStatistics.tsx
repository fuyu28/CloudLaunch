/**
 * @fileoverview ゲーム統計・管理コンポーネント
 *
 * このコンポーネントは、ゲームの統計情報、チャート、プレイセッション履歴を表示します。
 * 既存のカードコンポーネントを統合して表示します。
 */

import { memo } from "react"

import ChapterBarChart from "./ChapterBarChart"
import ChapterDisplayCard from "./ChapterDisplayCard"
import CloudDataCard from "./CloudDataCard"
import MemoCard from "./MemoCard"
import PlaySessionCard from "./PlaySessionCard"
import type { GameType } from "src/types/game"

interface GameStatisticsProps {
  /** ゲーム情報 */
  game: GameType
  /** 更新キー（データ再取得トリガー） */
  refreshKey: number
  /** 有効な認証情報フラグ */
  isValidCreds: boolean
  /** アップロード中フラグ */
  isUploading: boolean
  /** ダウンロード中フラグ */
  isDownloading: boolean
  /** データ更新ハンドラ */
  onDataRefresh: () => void
  /** プレイセッション追加ハンドラ */
  onAddPlaySession: () => void
  /** チャプター設定モーダル開く */
  onOpenChapterSettings: () => void
  /** チャプター追加モーダル開く */
  onOpenChapterAdd: () => void
  /** プロセス管理モーダル開く */
  onOpenProcessManagement: () => void
  /** セーブデータアップロード */
  onUploadSaveData: () => Promise<void>
  /** セーブデータダウンロード */
  onDownloadSaveData: () => Promise<void>
}

/**
 * ゲーム統計・管理コンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns ゲーム統計・管理要素
 */
const GameStatistics = memo(function GameStatistics({
  game,
  refreshKey,
  isValidCreds,
  isUploading,
  isDownloading,
  onDataRefresh,
  onAddPlaySession,
  onOpenChapterSettings,
  onOpenChapterAdd,
  onOpenProcessManagement,
  onUploadSaveData,
  onDownloadSaveData
}: GameStatisticsProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* チャプター統計グラフ */}
      <ChapterBarChart
        key={`chapter-chart-${refreshKey}`}
        gameId={game.id}
        gameTitle={game.title}
      />

      {/* 機能カード群 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* プレイセッション管理カード */}
        <PlaySessionCard
          key={`play-session-${refreshKey}`}
          gameId={game.id}
          gameTitle={game.title}
          onAddSession={onAddPlaySession}
          onSessionUpdated={onDataRefresh}
          onProcessManagement={onOpenProcessManagement}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* チャプター表示・管理カード */}
          <ChapterDisplayCard
            key={`chapter-display-${refreshKey}`}
            gameId={game.id}
            gameTitle={game.title}
            currentChapterId={game.currentChapter || undefined}
            onChapterSettings={onOpenChapterSettings}
            onAddChapter={onOpenChapterAdd}
            onChapterChange={onDataRefresh}
          />

          {/* クラウドデータ管理カード */}
          <CloudDataCard
            gameId={game.id}
            gameTitle={game.title}
            hasSaveFolder={!!game.saveFolderPath}
            isValidCreds={isValidCreds}
            isUploading={isUploading}
            isDownloading={isDownloading}
            onUpload={onUploadSaveData}
            onDownload={onDownloadSaveData}
          />

          {/* メモ管理カード */}
          <MemoCard gameId={game.id} />
        </div>
      </div>
    </div>
  )
})

export default GameStatistics
