import { S3Client } from "@aws-sdk/client-s3"

import { getCredential } from "./service/credentialService"
import { MESSAGES } from "../constants/messages"
import type { Creds } from "../types/creds"

/**
 * 保存済み認証情報を使用してS3Clientを作成
 *
 * @returns Promise<S3Client> 初期化されたS3Client
 * @throws Error 認証情報が設定されていない場合
 */
export async function creates3Client(): Promise<S3Client> {
  const result = await getCredential()

  if (!result.success || !result.data) {
    throw new Error(MESSAGES.R2_CLIENT.CREDENTIALS_NOT_SET)
  }

  return createS3ClientFromCredentials(result.data)
}

/**
 * 指定された認証情報を使用してS3Clientを作成
 *
 * @param credentials S3接続に使用する認証情報
 * @returns S3Client 初期化されたS3Client
 */
export function createS3ClientFromCredentials(credentials: Creds): S3Client {
  return new S3Client({
    region: credentials.region,
    endpoint: credentials.endpoint,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  })
}
