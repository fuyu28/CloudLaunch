/**
 * @fileoverview 正規表現パターン定数定義
 *
 * このファイルは、アプリケーション全体で使用される正規表現パターンを定数として定義します。
 * 主な機能：
 * - 正規表現の一元管理
 * - パターンの再利用
 * - バリデーション処理の統一
 * - 保守性の向上
 */

/**
 * アプリケーション全体で使用される正規表現パターン定数
 */
export const PATTERNS = {
  // バケット名のバリデーション
  /** S3バケット名の有効性チェック */
  BUCKET_NAME: /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,

  // Steam関連
  /** Steam URLパターン（steam://rungameid/123456 形式） */
  STEAM_URL: /^steam:\/\/rungameid\/([0-9]+)$/,

  // ファイル名サニタイズ
  /** ファイル名に使用できない文字 */
  INVALID_FILENAME_CHARS: /[<>:"/\\|?*]/g
} as const

/**
 * パターン定数の型定義
 */
export type Patterns = typeof PATTERNS
