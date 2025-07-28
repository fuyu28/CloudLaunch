/**
 * @fileoverview 認証情報検証フック
 *
 * このフックは、クラウドストレージ認証情報の検証機能を提供します。
 * 主な機能：
 * - 認証情報の取得
 * - 認証情報の検証
 * - グローバル状態の更新
 * - エラーハンドリング
 *
 * 使用例：
 * ```tsx
 * const validateCreds = useValidateCreds()
 * const isValid = await validateCreds()
 * ```
 */

import { isValidCredsAtom } from "@renderer/state/credentials"
import { useSetAtom } from "jotai"
import { useCallback } from "react"

/**
 * 認証情報検証フック
 *
 * 保存されている認証情報を検証し、グローバル状態を更新します。
 *
 * @returns 認証情報検証関数
 */
export function useValidateCreds(): () => Promise<boolean> {
  const setIsValidCreds = useSetAtom(isValidCredsAtom)

  /**
   * 認証情報を検証する
   *
   * 保存されている認証情報を取得し、その有効性を検証します。
   * 検証結果に基づいてグローバル状態を更新します。
   *
   * @returns 認証情報が有効かどうか
   */
  const validate = useCallback(async () => {
    try {
      const result = await window.api.credential.getCredential()
      if (!result.success || !result.data) {
        setIsValidCreds(false)
        return false
      }
      const { success, err } = await window.api.credential.validateCredential(result.data)
      setIsValidCreds(success)
      if (!success) {
        console.error("Credential validation failed:", err?.message ?? "不明なエラー")
      }
      return success
    } catch {
      setIsValidCreds(false)
      return false
    }
  }, [setIsValidCreds])

  return validate
}
