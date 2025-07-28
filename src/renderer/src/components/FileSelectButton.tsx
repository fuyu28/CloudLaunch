/**
 * @fileoverview ファイル選択ボタンコンポーネント
 *
 * このコンポーネントは、ファイルやフォルダの選択操作を統一的に提供します。
 *
 * 主な機能：
 * - ファイル選択ダイアログの表示
 * - フォルダ選択ダイアログの表示
 * - 選択中状態の表示
 * - カスタムラベルとプレースホルダーの対応
 *
 * 使用例：
 * ```tsx
 * <FileSelectButton
 *   label="画像ファイル"
 *   value={imagePath}
 *   onChange={(path) => setImagePath(path)}
 *   onBrowse={browseImage}
 *   disabled={isBrowsing}
 *   placeholder="画像を選択してください"
 * />
 * ```
 */

import { MESSAGES } from "../../../constants"

/**
 * ファイル選択ボタンコンポーネントのprops
 */
export interface FileSelectButtonProps {
  /** ラベルテキスト */
  label: string
  /** 現在選択されているファイルパス */
  value: string
  /** ファイルパス変更時のコールバック */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** ファイル選択ダイアログを開くコールバック */
  onBrowse: () => void
  /** 選択中などで無効化する場合は true */
  disabled?: boolean
  /** プレースホルダーテキスト */
  placeholder?: string
  /** 入力フィールドの名前属性 */
  name?: string
  /** 必須フィールドかどうか */
  required?: boolean
  /** 参照ボタンのテキスト */
  browseButtonText?: string
  /** エラーメッセージ */
  errorMessage?: string
  /** フィールドがフォーカスを失った時のコールバック */
  onBlur?: () => void
}

/**
 * ファイル選択ボタンコンポーネント
 *
 * ファイルパスの入力フィールドと参照ボタンを組み合わせたコンポーネントです。
 *
 * @param props コンポーネントのprops
 * @returns ファイル選択ボタン要素
 */
export function FileSelectButton({
  label,
  value,
  onChange,
  onBrowse,
  disabled = false,
  placeholder = "",
  name,
  required = false,
  browseButtonText = MESSAGES.UI.BROWSE,
  errorMessage,
  onBlur
}: FileSelectButtonProps): React.JSX.Element {
  const inputId = name || label.replace(/\s+/g, "-").toLowerCase()

  return (
    <div>
      <label className="label" htmlFor={inputId}>
        <span className="label-text">{label}</span>
      </label>
      <div className="flex">
        <input
          type="text"
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`input input-bordered flex-1 ${errorMessage ? "input-error" : ""}`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
        <button type="button" className="btn ml-2" onClick={onBrowse} disabled={disabled}>
          {browseButtonText}
        </button>
      </div>
      {errorMessage && (
        <div className="label">
          <span className="label-text-alt text-error">{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

export default FileSelectButton
