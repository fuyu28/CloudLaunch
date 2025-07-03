import { join, dirname, relative } from "path"
import { promises as fs } from "fs"
import { ipcMain } from "electron"
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createR2Client } from "../r2Client"
import { getCredential } from "../service/credentialService"
import { ApiResult } from "../../types/result"
import { handleAwsSdkError } from "../utils/awsSdkErrorHandler"

export function registerDownloadSaveDataHandler(): void {
  ipcMain.handle(
    "download-save-data",
    async (_event, localSaveFolderPath: string, r2DestinationPath: string): Promise<ApiResult> => {
      try {
        const r2Client = await createR2Client()
        const creds = await getCredential()
        if (!creds) {
          return { success: false, message: "R2/S3 クレデンシャルが設定されていません" }
        }

        const allKeys: string[] = []
        let token: string | undefined = undefined
        do {
          const listRes = await r2Client.send(
            new ListObjectsV2Command({
              Bucket: creds.bucketName,
              Prefix: r2DestinationPath.replace(/\/+$/, "") + "/",
              ContinuationToken: token
            })
          )
          listRes.Contents?.forEach((obj) => {
            if (obj.Key) allKeys.push(obj.Key)
          })
          token = listRes.NextContinuationToken
        } while (token)

        for (const key of allKeys) {
          const relativePath = relative(r2DestinationPath, key)
          const outputPath = join(localSaveFolderPath, relativePath)

          await fs.mkdir(dirname(outputPath), { recursive: true })

          const getRes = await r2Client.send(
            new GetObjectCommand({
              Bucket: creds.bucketName,
              Key: key
            })
          )

          const bodyStream = getRes.Body as NodeJS.ReadableStream
          const fileHandle = await fs.open(outputPath, "w")
          await new Promise<void>((resolve, reject) => {
            const writeStream = fileHandle.createWriteStream()
            bodyStream.pipe(writeStream).on("finish", resolve).on("error", reject)
          }).finally(() => fileHandle.close())
        }

        return { success: true }
      } catch (err: unknown) {
        console.error(err)
        const awsSdkError = handleAwsSdkError(err)
        if (awsSdkError) {
          return { success: false, message: `ダウンロードに失敗しました: ${awsSdkError.message}` }
        }
        if (err instanceof Error) {
          return { success: false, message: `ダウンロードに失敗しました: ${err.message}` }
        }
        return { success: false, message: "ダウンロード中に不明なエラーが発生しました。" }
      }
    }
  )
}
