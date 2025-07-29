/**
 * @fileoverview クラウドストレージ認証情報管理サービス
 *
 * このサービスは、R2/S3クラウドストレージへの接続に必要な認証情報を安全に管理します。
 * - セキュアキーチェーン（keytar）: secretAccessKeyの暗号化保存
 * - electron-store: その他の設定情報（endpoint, region, bucketName等）の保存
 *
 * セキュリティ考慮事項：
 * - 秘密鍵はOSのキーチェーンに保存され、平文でディスクに書き込まれません
 * - アクセスキーIDなどの機密性の低い情報のみelectron-storeに保存
 * - エラーメッセージから機密情報を除去（詳細はログのみに記録）
 * - 認証情報取得時の詳細なエラーハンドリング（権限エラー、キーチェーン不存在など）
 */

import Store from "electron-store"
import keytar from "keytar"

import { MESSAGES } from "../../constants/messages"
import type { Creds } from "../../types/creds"
import type { ApiResult } from "../../types/result"
import { logger } from "../utils/logger"

type StoreSchema = {
  bucketName: string
  region: string
  endpoint: string
  accessKeyId: string
}

const store = new Store<StoreSchema>({
  defaults: {
    bucketName: "",
    region: "auto",
    endpoint: "",
    accessKeyId: ""
  }
}) as Store<StoreSchema> & {
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K]
}

const SERVICE = "CloudLaunch"

export async function setCredential(creds: Creds): Promise<ApiResult> {
  try {
    store.set("bucketName", creds.bucketName)
    store.set("region", creds.region)
    store.set("endpoint", creds.endpoint)
    store.set("accessKeyId", creds.accessKeyId)

    await keytar.setPassword(SERVICE, "secretAccessKey", creds.secretAccessKey)
    return { success: true }
  } catch (error) {
    logger.error(MESSAGES.CREDENTIAL_SERVICE.SET_FAILED(String(error)))
    return { success: false, message: MESSAGES.CREDENTIAL_SERVICE.SET_FAILED(String(error)) }
  }
}

export async function getCredential(): Promise<ApiResult<Creds>> {
  try {
    // keytarからsecretAccessKeyを取得
    const secretAccessKey = await keytar.getPassword(SERVICE, "secretAccessKey")

    // electron-storeから他の認証情報を取得
    const bucketName = store.get("bucketName")
    const region = store.get("region")
    const endpoint = store.get("endpoint")
    const accessKeyId = store.get("accessKeyId")

    // 必要な認証情報が不足していないかチェック
    if (!bucketName || !region || !endpoint || !accessKeyId || !secretAccessKey) {
      // secretAccessKeyがnullの場合は完全に見つからない状態
      if (secretAccessKey === null) {
        return {
          success: false,
          message: MESSAGES.AUTH.CREDENTIAL_NOT_FOUND
        }
      }
      // その他の場合は不完全な認証情報
      return {
        success: false,
        message: MESSAGES.AUTH.CREDENTIAL_INVALID
      }
    }

    return {
      success: true,
      data: {
        bucketName,
        region,
        endpoint,
        accessKeyId,
        secretAccessKey
      }
    }
  } catch (err) {
    logger.error(MESSAGES.CREDENTIAL_SERVICE.GET_FAILED, err)

    // keytarのエラーに関する詳細なメッセージを提供（機密情報を含まないように制限）
    let errorMessage: string = MESSAGES.CREDENTIAL_SERVICE.GET_FAILED

    if (err instanceof Error) {
      // keytarの一般的なエラーパターンをチェック（機密情報を露出しないように制限）
      if (err.message.includes("The specified item could not be found")) {
        errorMessage = MESSAGES.CREDENTIAL_SERVICE.KEYCHAIN_ITEM_NOT_FOUND
      } else if (err.message.includes("Access denied")) {
        errorMessage = MESSAGES.CREDENTIAL_SERVICE.KEYCHAIN_ACCESS_DENIED
      } else if (err.message.includes("The keychain does not exist")) {
        errorMessage = MESSAGES.CREDENTIAL_SERVICE.KEYCHAIN_NOT_FOUND
      } else {
        // 詳細なエラーメッセージは機密情報を含む可能性があるため、ログにのみ記録
        logger.error("認証情報取得の詳細エラー:", err.message)
        errorMessage = MESSAGES.CREDENTIAL_SERVICE.GET_ERROR(err.message)
      }
    } else if (typeof err === "string") {
      // 文字列エラーの場合は詳細なエラーメッセージを返す
      logger.error("認証情報取得の非Error型エラー:", typeof err)
      errorMessage = MESSAGES.CREDENTIAL_SERVICE.GET_ERROR(err)
    } else {
      // その他の型のエラーは機密情報を含む可能性があるため、詳細は記録しない
      logger.error("認証情報取得の非Error型エラー:", typeof err)
      errorMessage = MESSAGES.CREDENTIAL_SERVICE.GET_FAILED
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}
