import { ipcMain } from "electron"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createR2Client } from "../r2Client"
import { getCredential } from "../service/credentialService"

export function registerGetR2FolderListHandler(): void {
  ipcMain.handle("get-r2-folder-list", async (): Promise<string[] | null> => {
    try {
      const r2Client = await createR2Client()
      const creds = await getCredential()
      if (!creds) {
        throw new Error("R2/S3 クレデンシャルが設定されていません")
      }
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
