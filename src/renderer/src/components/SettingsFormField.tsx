/**
 * @fileoverview 設定フォームフィールドコンポーネント
 *
 * このコンポーネントは、設定ページで使用される入力フィールドを統一的に提供します。
 *
 * 主な機能：
 * - ラベル付き入力フィールド
 * - 統一的なスタイリング
 * - プレースホルダー対応
 * - バリデーション状態の表示
 * - パスワードフィールド対応
 *
 * 使用例：
 * ```tsx
 * <SettingsFormField
 *   label="Bucket Name"
 *   value={bucketName}
 *   onChange={(value) => setBucketName(value)}
 *   placeholder="バケット名を入力"
 * />
 * ```
 */

/**
 * 設定フォームフィールドコンポーネントのprops
 */
export interface SettingsFormFieldProps {
  /** ラベルテキスト */
  label: string
  /** 現在の値 */
  value: string
  /** 値変更時のコールバック */
  onChange: (value: string) => void
  /** プレースホルダーテキスト */
  placeholder?: string
  /** パスワードフィールドかどうか */
  type?: "text" | "password"
  /** フィールドを無効化する場合は true */
  disabled?: boolean
  /** 必須フィールドかどうか */
  required?: boolean
  /** エラーメッセージ */
  error?: string
  /** ヘルプテキスト */
  helpText?: string
  /** ラベルの幅（Tailwind CSS クラス） */
  labelWidth?: string
}

/**
 * 設定フォームフィールドコンポーネント
 *
 * 設定ページで使用される統一的な入力フィールドを提供します。
 *
 * @param props コンポーネントのprops
 * @returns 設定フォームフィールド要素
 */
export function SettingsFormField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  required = false,
  error,
  helpText,
  labelWidth = "w-36"
}: SettingsFormFieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center">
        <span className={`${labelWidth} text-sm font-medium`}>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
        <input
          type={type}
          className={`input input-bordered flex-1 ${error ? "input-error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />
      </div>

      {/* エラーメッセージ */}
      {error && <div className="text-error text-sm ml-36">{error}</div>}

      {/* ヘルプテキスト */}
      {helpText && !error && <div className="text-base-content text-xs ml-36">{helpText}</div>}
    </div>
  )
}

export default SettingsFormField
