/**
 * @fileoverview パスセキュリティユーティリティ
 *
 * このモジュールは、パストラバーサル攻撃対策を含む
 * パスの安全性検証機能を提供します。
 *
 * 主な機能：
 * - パストラバーサル攻撃対策
 * - パス形式の検証
 * - セキュアなパス操作
 */

import { PATH_SECURITY } from "../constants/processing"

/**
 * パスセキュリティエラークラス
 */
export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PathSecurityError"
  }
}

/**
 * パストラバーサル攻撃対策のためのパス検証
 *
 * この関数は以下のセキュリティチェックを実行します：
 * - "../" パターンの検出（パストラバーサル攻撃対策）
 * - 絶対パス（"/" で始まる）の検出
 * - 不正な文字の検出
 *
 * @param path 検証対象のパス
 * @throws PathSecurityError 不正なパスが検出された場合
 */
export function validatePathSecurity(path: string): void {
  // パストラバーサル攻撃対策
  if (path.includes("..")) {
    throw new PathSecurityError("パストラバーサル攻撃の可能性があるパスが検出されました")
  }

  // 絶対パスのチェック
  if (path.startsWith("/")) {
    throw new PathSecurityError("絶対パスは許可されていません")
  }

  // 空のパスのチェック
  if (path.trim() === "") {
    throw new PathSecurityError("空のパスは許可されていません")
  }

  // null文字のチェック（Path Injection対策）
  if (path.includes("\0")) {
    throw new PathSecurityError("null文字を含むパスは許可されていません")
  }
}

/**
 * クラウドストレージ用のオブジェクトキー検証
 *
 * S3/R2オブジェクトキーに対する追加的なセキュリティ検証を実行します。
 *
 * @param objectKey 検証対象のオブジェクトキー
 * @throws PathSecurityError 不正なオブジェクトキーが検出された場合
 */
export function validateObjectKeySecurity(objectKey: string): void {
  // 基本的なパスセキュリティチェック
  validatePathSecurity(objectKey)

  // S3/R2固有のチェック
  if (objectKey.length > PATH_SECURITY.MAX_OBJECT_KEY_LENGTH) {
    throw new PathSecurityError(
      `オブジェクトキーが長すぎます（最大${PATH_SECURITY.MAX_OBJECT_KEY_LENGTH}文字）`
    )
  }

  // 制御文字のチェック
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(objectKey)) {
    throw new PathSecurityError("制御文字を含むオブジェクトキーは許可されていません")
  }
}

/**
 * パスが安全かどうかをboolean値で返すヘルパー関数
 *
 * @param path 検証対象のパス
 * @returns パスが安全な場合はtrue、そうでなければfalse
 */
export function isPathSafe(path: string): boolean {
  try {
    validatePathSecurity(path)
    return true
  } catch {
    return false
  }
}

/**
 * オブジェクトキーが安全かどうかをboolean値で返すヘルパー関数
 *
 * @param objectKey 検証対象のオブジェクトキー
 * @returns オブジェクトキーが安全な場合はtrue、そうでなければfalse
 */
export function isObjectKeySafe(objectKey: string): boolean {
  try {
    validateObjectKeySecurity(objectKey)
    return true
  } catch {
    return false
  }
}
