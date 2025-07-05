/**
 * @fileoverview ゲームフォームフィールドコンポーネント
 *
 * このコンポーネントは、ゲーム登録・編集フォームの入力フィールドを提供します。
 *
 * 主な機能：
 * - ゲーム基本情報の入力フィールド（タイトル、発行元等）
 * - ファイル選択フィールド（画像、実行ファイル、セーブフォルダ）
 * - 統一的なスタイリング
 * - バリデーション対応
 *
 * 使用例：
 * ```tsx
 * <GameFormFields
 *   gameData={gameData}
 *   onChange={handleChange}
 *   onBrowseImage={browseImage}
 *   onBrowseExe={browseExe}
 *   onBrowseSaveFolder={browseSaveFolder}
 *   disabled={submitting}
 * />
 * ```
 */

import React from "react"
import { FileSelectButton } from "./FileSelectButton"
import type { InputGameData } from "../../../types/game"

/**
 * ゲームフォームフィールドコンポーネントのprops
 */
export interface GameFormFieldsProps {
  /** ゲームデータ */
  gameData: InputGameData
  /** フィールド変更時のコールバック */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** 画像ファイル選択のコールバック */
  onBrowseImage: () => void
  /** 実行ファイル選択のコールバック */
  onBrowseExe: () => void
  /** セーブフォルダ選択のコールバック */
  onBrowseSaveFolder: () => void
  /** フィールドを無効化する場合は true */
  disabled?: boolean
}

/**
 * ゲームフォームフィールドコンポーネント
 *
 * ゲーム登録・編集で使用される入力フィールドを提供します。
 *
 * @param props コンポーネントのprops
 * @returns ゲームフォームフィールド要素
 */
export function GameFormFields({
  gameData,
  onChange,
  onBrowseImage,
  onBrowseExe,
  onBrowseSaveFolder,
  disabled = false
}: GameFormFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* タイトル */}
      <div>
        <label className="label" htmlFor="title">
          <span className="label-text">タイトル</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={gameData.title}
          onChange={onChange}
          className="input input-bordered w-full"
          required
          disabled={disabled}
        />
      </div>

      {/* ブランド */}
      <div>
        <label className="label" htmlFor="publisher">
          <span className="label-text">ブランド</span>
        </label>
        <input
          type="text"
          id="publisher"
          name="publisher"
          value={gameData.publisher}
          onChange={onChange}
          className="input input-bordered w-full"
          required
          disabled={disabled}
        />
      </div>

      {/* サムネイル画像 */}
      <FileSelectButton
        label="サムネイル画像の場所"
        name="imagePath"
        value={gameData.imagePath || ""}
        onChange={onChange}
        onBrowse={onBrowseImage}
        disabled={disabled}
        placeholder="画像ファイルを選択してください"
      />

      {/* 実行ファイル */}
      <FileSelectButton
        label="実行ファイルの場所"
        name="exePath"
        value={gameData.exePath}
        onChange={onChange}
        onBrowse={onBrowseExe}
        disabled={disabled}
        placeholder="実行ファイルを選択してください"
        required
      />

      {/* セーブデータフォルダ */}
      <FileSelectButton
        label="セーブデータフォルダの場所"
        name="saveFolderPath"
        value={gameData.saveFolderPath || ""}
        onChange={onChange}
        onBrowse={onBrowseSaveFolder}
        disabled={disabled}
        placeholder="セーブデータフォルダを選択してください"
      />
    </div>
  )
}

export default GameFormFields
