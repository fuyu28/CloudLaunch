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
 * - 認証情報取得時の詳細なエラーハンドリング（権限エラー、キーチェーン不存在など）
 */

import Store from "electron-store"
import type { Creds } from "../../types/creds"
import { ApiResult } from "../../types/result"
import keytar from "keytar"
import { logger } from "../utils/logger"

interface StoreSchema {
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

const SERVICE = "StorageDeck"

export async function setCredential(creds: Creds): Promise<ApiResult> {
  try {
    store.set("bucketName", creds.bucketName)
    store.set("region", creds.region)
    store.set("endpoint", creds.endpoint)
    store.set("accessKeyId", creds.accessKeyId)
    await keytar.setPassword(SERVICE, "secretAccessKey", creds.secretAccessKey)
    return { success: true }
  } catch (err) {
    logger.error("認証情報設定エラー:", err)
    return { success: false, message: `認証情報の設定に失敗しました: ${err}` }
  }
}

export async function getCredential(): Promise<ApiResult<Creds>> {
  try {
    // keytarからsecretAccessKeyを取得
    const secret = await keytar.getPassword(SERVICE, "secretAccessKey")

    if (secret === null) {
      return {
        success: false,
        message: "認証情報が見つかりません。まず認証情報を設定してください。"
      }
    }

    // electron-storeから他の認証情報を取得
    const bucketName = store.get("bucketName")
    const region = store.get("region")
    const endpoint = store.get("endpoint")
    const accessKeyId = store.get("accessKeyId")

    // 必要な認証情報が不足していないかチェック
    if (!bucketName || !region || !endpoint || !accessKeyId) {
      return {
        success: false,
        message: "認証情報が不完全です。すべての設定項目を確認してください。"
      }
    }

    return {
      success: true,
      data: {
        bucketName: bucketName as string,
        region: region as string,
        endpoint: endpoint as string,
        accessKeyId: accessKeyId as string,
        secretAccessKey: secret
      }
    }
  } catch (err) {
    logger.error("認証情報取得エラー:", err)

    // keytarのエラーに関する詳細なメッセージを提供
    let errorMessage = "認証情報の取得に失敗しました。"

    if (err instanceof Error) {
      // keytarの一般的なエラーパターンをチェック
      if (err.message.includes("The specified item could not be found")) {
        errorMessage =
          "認証情報がシステムキーチェーンに見つかりません。認証情報を再設定してください。"
      } else if (err.message.includes("Access denied")) {
        errorMessage =
          "システムキーチェーンへのアクセスが拒否されました。アプリケーションの権限を確認してください。"
      } else if (err.message.includes("The keychain does not exist")) {
        errorMessage = "システムキーチェーンが存在しません。OSの設定を確認してください。"
      } else {
        errorMessage = `認証情報の取得エラー: ${err.message}`
      }
    } else if (typeof err === "string") {
      errorMessage = `認証情報の取得エラー: ${err}`
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}
