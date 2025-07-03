import { S3Client } from "@aws-sdk/client-s3"
import { getCredential } from "./service/credentialService"

export async function createR2Client(): Promise<S3Client> {
  const result = await getCredential()

  if (!result.success || !result.data) {
    throw new Error(result.success ? "R2/S3 のクレデンシャルが設定されていません" : result.message)
  }

  const creds = result.data
  const r2Client = new S3Client({
    region: creds.region,
    endpoint: creds.endpoint,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey
    }
  })
  return r2Client
}
