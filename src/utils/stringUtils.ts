/**
 * @fileoverview 文字列操作ユーティリティ
 *
 * このファイルは、アプリケーション全体で使用される文字列操作関数を提供します。
 * 主な機能：
 * - ファイル名のサニタイズ
 * - パス文字列の操作
 * - 文字列の正規化
 * - エスケープ処理
 */

import { PATTERNS } from "../constants"

/**
 * ファイル名として使用できない文字をアンダースコアに置換
 * @param filename - サニタイズするファイル名
 * @returns サニタイズされたファイル名
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(PATTERNS.INVALID_FILENAME_CHARS, "_")
}

/**
 * ゲームタイトルからリモートパス用の安全な文字列を生成
 * @param gameTitle - ゲームタイトル
 * @returns サニタイズされたタイトル
 */
export function sanitizeGameTitle(gameTitle: string): string {
  return sanitizeFilename(gameTitle)
}

/**
 * ゲームタイトルからリモートパスを生成
 * @param gameTitle - ゲームタイトル
 * @returns リモートパス（games/{サニタイズされたタイトル}/save_data）
 */
export function createRemotePath(gameTitle: string): string {
  const sanitizedTitle = sanitizeGameTitle(gameTitle)
  return `games/${sanitizedTitle}/save_data`
}

/**
 * 文字列が空または空白のみでないかチェック
 * @param value - チェックする文字列
 * @returns 有効な文字列の場合 true
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * 文字列の先頭と末尾の空白を削除し、連続する空白を単一のスペースに変換
 * @param value - 正規化する文字列
 * @returns 正規化された文字列
 */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/**
 * キャメルケースをケバブケースに変換
 * @param camelCase - キャメルケース文字列
 * @returns ケバブケース文字列
 */
export function camelToKebab(camelCase: string): string {
  return camelCase.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase()
}

/**
 * 文字列を指定された長さで切り詰め、必要に応じて省略記号を追加
 * @param text - 切り詰める文字列
 * @param maxLength - 最大長
 * @param ellipsis - 省略記号（デフォルト: "..."）
 * @returns 切り詰められた文字列
 */
export function truncateString(text: string, maxLength: number, ellipsis = "..."): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis
}
