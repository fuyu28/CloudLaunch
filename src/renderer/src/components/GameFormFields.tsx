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

import { FileSelectButton } from "./FileSelectButton"
import type { InputGameData } from "../../../types/game"
import type { GameFormValidationResult } from "../hooks/useGameFormValidationZod"

/**
 * ゲームフォームフィールドコンポーネントのprops
 */
export type GameFormFieldsProps = {
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
  /** バリデーション結果 */
  validation: GameFormValidationResult
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
  disabled = false,
  validation
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
          onBlur={() => validation.markFieldAsTouched("title")}
          className={`input input-bordered w-full ${validation.errors.title ? "input-error" : ""}`}
          required
          disabled={disabled}
        />
        {validation.errors.title && (
          <div className="label">
            <span className="label-text-alt text-error">{validation.errors.title}</span>
          </div>
        )}
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
          onBlur={() => validation.markFieldAsTouched("publisher")}
          className={`input input-bordered w-full ${validation.errors.publisher ? "input-error" : ""}`}
          required
          disabled={disabled}
        />
        {validation.errors.publisher && (
          <div className="label">
            <span className="label-text-alt text-error">{validation.errors.publisher}</span>
          </div>
        )}
      </div>

      {/* サムネイル画像 */}
      <FileSelectButton
        label="サムネイル画像の場所"
        name="imagePath"
        value={gameData.imagePath || ""}
        onChange={onChange}
        onBrowse={onBrowseImage}
        onBlur={() => validation.markFieldAsTouched("imagePath")}
        disabled={disabled}
        placeholder="画像ファイルを選択してください"
        errorMessage={validation.errors.imagePath}
      />

      {/* 実行ファイル */}
      <FileSelectButton
        label="実行ファイルの場所"
        name="exePath"
        value={gameData.exePath}
        onChange={onChange}
        onBrowse={onBrowseExe}
        onBlur={() => validation.markFieldAsTouched("exePath")}
        disabled={disabled}
        placeholder="実行ファイルを選択してください"
        required
        errorMessage={validation.errors.exePath}
      />

      {/* セーブデータフォルダ */}
      <FileSelectButton
        label="セーブデータフォルダの場所"
        name="saveFolderPath"
        value={gameData.saveFolderPath || ""}
        onChange={onChange}
        onBrowse={onBrowseSaveFolder}
        onBlur={() => validation.markFieldAsTouched("saveFolderPath")}
        disabled={disabled}
        placeholder="セーブデータフォルダを選択してください"
        errorMessage={validation.errors.saveFolderPath}
      />
    </div>
  )
}

export default GameFormFields
