import { ipcMain } from "electron"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createR2Client } from "../r2Client"
import { getCredential } from "../service/credentialService"

export function registerSaveDataFolderListHandler(): void {
  ipcMain.handle("list-remote-save-data-folders", async (): Promise<string[] | null> => {
    try {
      const r2Client = await createR2Client()
      const credsResult = await getCredential()
      if (!credsResult.success || !credsResult.data) {
        throw new Error(
          credsResult.success ? "R2/S3 クレデンシャルが設定されていません" : credsResult.message
        )
      }
      const creds = credsResult.data
      const cmd = new ListObjectsV2Command({
        Bucket: creds.bucketName,
        Delimiter: "/"
      })
      const res = await r2Client.send(cmd)
      const dirs = res.CommonPrefixes?.map((cp) => cp.Prefix!.replace(/[\\/]+$/, "")) ?? null
      return dirs
    } catch (err) {
      console.error(err)
      return null
    }
  })
}
