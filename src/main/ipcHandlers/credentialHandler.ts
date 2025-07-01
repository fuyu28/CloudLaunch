import { ipcMain } from "electron"
import type { Creds } from "../../types/creds"
import { getCredential, setCredential } from "../service/credentialService"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { handleAwsSdkError } from "../utils/awsSdkErrorHandler"
import { AwsSdkError } from "../../types/error"

export function registerCredentialHandler(): void {
  ipcMain.handle(
    "upsert-credential",
    async (_event, creds: Creds): Promise<{ success: boolean }> => {
      const res = await setCredential(creds)
      return res
    }
  )

  ipcMain.handle("get-credential", async (): Promise<Creds | null> => {
    const res = await getCredential()
    return res
  })

  ipcMain.handle(
    "validate-credential",
    async (_event, creds: Creds): Promise<{ success: boolean; err?: AwsSdkError }> => {
      try {
        const r2Client = new S3Client({
          region: creds.region,
          endpoint: creds.endpoint,
          credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey
          }
        })
        await r2Client.send(
          new ListObjectsV2Command({
            Bucket: creds.bucketName,
            Delimiter: "/",
            MaxKeys: 1
          })
        )
        return { success: true }
      } catch (err: unknown) {
        const awsSdkError = handleAwsSdkError(err)
        return { success: false, err: awsSdkError }
      }
    }
  )
}
