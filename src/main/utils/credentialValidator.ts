/**
 * @fileoverview 認証情報検証ユーティリティ
 *
 * このモジュールは、R2/S3 認証情報の検証と R2 クライアントの作成を
 * 統一的に処理するためのユーティリティ関数を提供します。
 *
 * 主な機能：
 * - 認証情報の取得と検証
 * - R2 クライアントの作成
 * - 統一的なエラーハンドリング
 * - 認証情報の完全性チェック
 */

import { MESSAGES } from "../../constants"
import type { Creds as Credential } from "../../types/creds"
import type { ApiResult } from "../../types/result"
import { creates3Client } from "../s3Client"
import { getCredential } from "../service/credentialService"
import type { S3Client } from "@aws-sdk/client-s3"

/**
 * 認証情報検証結果の型定義
 */
export type ValidatedCredentialResult = {
  /** 認証情報データ */
  credentials: Credential
  /** 初期化された R2 クライアント */
  s3Client: S3Client
}

/**
 * R2/S3 認証情報を検証し、クライアントを作成する統一関数
 *
 * この関数は以下の処理を実行します：
 * 1. credentialService から認証情報を取得
 * 2. 認証情報の存在と完全性をチェック
 * 3. R2 クライアントを作成
 * 4. 統一的な ApiResult 形式でのレスポンス生成
 *
 * @returns Promise<ApiResult<ValidatedCredentialResult>>
 *          成功時は認証情報とクライアントを含む結果、失敗時はエラーメッセージ
 */
export async function validateCredentialsForR2(): Promise<ApiResult<ValidatedCredentialResult>> {
  try {
    // 認証情報の取得
    const credentialResult = await getCredential()

    // 認証情報の基本チェック
    if (!credentialResult.success || !credentialResult.data) {
      return {
        success: false,
        message: credentialResult.success
          ? "R2/S3 クレデンシャルが設定されていません"
          : credentialResult.message
      }
    }

    const credentials = credentialResult.data

    // 認証情報の完全性チェック
    const validationResult = validateCredentialCompleteness(credentials)
    if (!validationResult.success) {
      return validationResult
    }

    // R2 クライアントの作成
    const s3Client = await creates3Client()

    return {
      success: true,
      data: {
        credentials,
        s3Client
      }
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `認証情報の検証中にエラーが発生しました: ${error.message}`
          : MESSAGES.CREDENTIAL_SERVICE.VALIDATION_UNKNOWN
    }
  }
}

/**
 * 認証情報の完全性をチェックする関数
 *
 * 必須フィールドの存在確認と値の妥当性をチェックします。
 *
 * @param credentials チェック対象の認証情報
 * @returns ApiResult<void> 検証結果
 */
export function validateCredentialCompleteness(credentials: Credential): ApiResult<void> {
  const requiredFields = [
    { key: "accessKeyId", label: "アクセスキー ID" },
    { key: "secretAccessKey", label: "シークレットアクセスキー" },
    { key: "endpoint", label: "エンドポイント" },
    { key: "bucketName", label: "バケット名" }
  ] as const

  for (const field of requiredFields) {
    const value = credentials[field.key]
    if (!value || typeof value !== "string" || value.trim() === "") {
      return {
        success: false,
        message: `${field.label}が設定されていません`
      }
    }
  }

  return { success: true }
}

/**
 * 認証情報の形式チェック
 *
 * 認証情報の各フィールドが適切な形式であるかをチェックします。
 *
 * @param credentials チェック対象の認証情報
 * @returns ApiResult<void> 検証結果
 */
export function validateCredentialFormat(credentials: Credential): ApiResult<void> {
  // エンドポイントの URL 形式チェック
  try {
    new URL(credentials.endpoint)
  } catch {
    return {
      success: false,
      message: "エンドポイントが有効な URL 形式ではありません"
    }
  }

  // バケット名の形式チェック（S3 バケット名のルールに準拠）
  const bucketNamePattern = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/
  if (!bucketNamePattern.test(credentials.bucketName)) {
    return {
      success: false,
      message: "バケット名の形式が正しくありません"
    }
  }

  // アクセスキーの長さチェック
  if (credentials.accessKeyId.length < 10) {
    return {
      success: false,
      message: MESSAGES.VALIDATION.INVALID_ACCESS_KEY_FORMAT
    }
  }

  // シークレットアクセスキーの長さチェック
  if (credentials.secretAccessKey.length < 20) {
    return {
      success: false,
      message: MESSAGES.VALIDATION.INVALID_SECRET_KEY_FORMAT
    }
  }

  return { success: true }
}

/**
 * 認証情報の完全な検証（完全性 + 形式）
 *
 * 認証情報の完全性と形式の両方をチェックします。
 *
 * @param credentials チェック対象の認証情報
 * @returns ApiResult<void> 検証結果
 */
export function validateCredentialFull(credentials: Credential): ApiResult<void> {
  // 完全性チェック
  const completenessResult = validateCredentialCompleteness(credentials)
  if (!completenessResult.success) {
    return completenessResult
  }

  // 形式チェック
  const formatResult = validateCredentialFormat(credentials)
  if (!formatResult.success) {
    return formatResult
  }

  return { success: true }
}
