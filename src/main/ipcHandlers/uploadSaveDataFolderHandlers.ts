import { readdir, readFile } from "fs/promises"
import { join, relative } from "path"
import { ipcMain } from "electron"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { createR2Client } from "../r2Client"
import { getCredential } from "../service/credentialService"
import { ApiResult } from "../../types/result"
import { handleAwsSdkError } from "../utils/awsSdkErrorHandler"

// ディレクトリを再帰的に探索して、すべてのファイルパスのリストを返す
async function getFilePathsRecursive(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true })
  const paths = await Promise.all(
    dirents.map(async (dirent) => {
      const res = join(dir, dirent.name)
      return dirent.isDirectory() ? getFilePathsRecursive(res) : res
    })
  )
  return Array.prototype.concat(...paths)
}

export function registerUploadSaveDataFolderHandlers(): void {
  ipcMain.handle(
    "upload-save-data-folder",
    async (_event, localPath: string, remotePath: string): Promise<ApiResult> => {
      try {
        const r2Client = await createR2Client()
        const credsResult = await getCredential()
        if (!credsResult.success || !credsResult.data) {
          return {
            success: false,
            message: credsResult.success
              ? "R2/S3 クレデンシャルが設定されていません"
              : credsResult.message
          }
        }
        const creds = credsResult.data

        const filePaths = await getFilePathsRecursive(localPath)

        for (const filePath of filePaths) {
          const fileBody = await readFile(filePath)
          const relativePath = relative(localPath, filePath)
          const r2Key = join(remotePath, relativePath).replace(/\\/g, "/")

          const cmd = new PutObjectCommand({
            Bucket: creds.bucketName,
            Key: r2Key,
            Body: fileBody
          })
          await r2Client.send(cmd)
        }
        return { success: true }
      } catch (error: unknown) {
        console.error(error)
        const awsSdkError = handleAwsSdkError(error)
        if (awsSdkError) {
          return { success: false, message: `アップロードに失敗しました: ${awsSdkError.message}` }
        }
        if (error instanceof Error) {
          return { success: false, message: `アップロードに失敗しました: ${error.message}` }
        }
        return { success: false, message: "アップロード中に不明なエラーが発生しました。" }
      }
    }
  )
}
