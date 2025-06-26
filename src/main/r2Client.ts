import { S3Client } from "@aws-sdk/client-s3"
import { getCredential } from "./service/credentialService"

export async function createR2Client(): Promise<S3Client> {
  const creds = await getCredential()

  if (!creds) {
    throw new Error("R2/S3 のクレデンシャルが設定されていません")
  }
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
