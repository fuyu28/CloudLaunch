import { S3Client } from "@aws-sdk/client-s3"

import { getCredential } from "./service/credentialService"
import { MESSAGES } from "../constants/messages"

export async function createR2Client(): Promise<S3Client> {
  const result = await getCredential()

  if (!result.success || !result.data) {
    throw new Error(MESSAGES.R2_CLIENT.CREDENTIALS_NOT_SET)
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
