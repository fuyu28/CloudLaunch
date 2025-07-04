/**
 * @fileoverview ゲーム操作ボタンコンポーネント
 *
 * このコンポーネントは、ゲーム詳細ページで使用される操作ボタン群を提供します。
 *
 * 主な機能：
 * - ゲーム起動ボタン
 * - 編集・削除ボタン
 * - セーブデータのアップロード・ダウンロードボタン
 * - ローディング状態の表示
 * - 無効化状態の管理
 *
 * 使用例：
 * ```tsx
 * <GameActionButtons
 *   onLaunch={handleLaunch}
 *   onEdit={openEdit}
 *   onDelete={() => setIsDeleteModalOpen(true)}
 *   onUpload={handleUploadSaveData}
 *   onDownload={handleDownloadSaveData}
 *   isLaunching={isLaunching}
 *   isUploading={isUploading}
 *   isDownloading={isDownloading}
 *   hasSaveFolder={!!game.saveFolderPath}
 *   isValidCreds={isValidCreds}
 * />
 * ```
 */

import React from "react"
import { IoIosPlay } from "react-icons/io"
import { MdEdit } from "react-icons/md"
import { FaTrash } from "react-icons/fa"

/**
 * ゲーム操作ボタンコンポーネントのprops
 */
export interface GameActionButtonsProps {
  /** ゲーム起動時のコールバック */
  onLaunch: () => void
  /** ゲーム編集時のコールバック */
  onEdit: () => void
  /** ゲーム削除時のコールバック */
  onDelete: () => void
  /** セーブデータアップロード時のコールバック */
  onUpload: () => void
  /** セーブデータダウンロード時のコールバック */
  onDownload: () => void
  /** ゲーム起動中かどうか */
  isLaunching?: boolean
  /** セーブデータアップロード中かどうか */
  isUploading?: boolean
  /** セーブデータダウンロード中かどうか */
  isDownloading?: boolean
  /** セーブフォルダが設定されているかどうか */
  hasSaveFolder?: boolean
  /** 認証情報が有効かどうか */
  isValidCreds?: boolean
}

/**
 * ゲーム操作ボタンコンポーネント
 *
 * ゲーム詳細ページで使用される操作ボタン群を提供します。
 *
 * @param props コンポーネントのprops
 * @returns ゲーム操作ボタン要素
 */
export function GameActionButtons({
  onLaunch,
  onEdit,
  onDelete,
  onUpload,
  onDownload,
  isLaunching = false,
  isUploading = false,
  isDownloading = false,
  hasSaveFolder = false,
  isValidCreds = false
}: GameActionButtonsProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 mt-8">
      {/* １行目：実行ボタン */}
      <button
        onClick={onLaunch}
        disabled={isLaunching}
        className="btn btn-primary btn-lg w-full h-12 flex items-center justify-center gap-2"
      >
        {isLaunching ? (
          <>
            <IoIosPlay className="animate-spin text-2xl" />
            <span className="text-lg">起動中…</span>
          </>
        ) : (
          <>
            <IoIosPlay size={24} />
            <span className="text-lg font-medium">ゲームを起動</span>
          </>
        )}
      </button>

      {/* ２行目：編集／削除 */}
      <div className="flex gap-2">
        <button className="btn btn-outline btn-md flex-1 h-10" onClick={onEdit}>
          <MdEdit /> 編集
        </button>
        <button className="btn btn-error btn-md flex-1 h-10" onClick={onDelete}>
          <FaTrash /> 登録を解除
        </button>
      </div>

      {/* ３行目：アップロード／ダウンロード */}
      <div className="flex gap-2">
        <button
          className="btn btn-outline btn-md flex-1 h-10"
          onClick={onUpload}
          disabled={isUploading || !hasSaveFolder || !isValidCreds}
        >
          {isUploading ? (
            <span className="loading loading-spinner">アップロード中…</span>
          ) : (
            "アップロード"
          )}
        </button>
        <button
          className="btn btn-outline btn-md flex-1 h-10"
          onClick={onDownload}
          disabled={isDownloading || !hasSaveFolder || !isValidCreds}
        >
          {isDownloading ? (
            <span className="loading loading-spinner">ダウンロード中…</span>
          ) : (
            "ダウンロード"
          )}
        </button>
      </div>
    </div>
  )
}

export default GameActionButtons
