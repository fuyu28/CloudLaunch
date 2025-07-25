/**
 * @fileoverview クラウドデータの閲覧・管理機能
 *
 * このハンドラーは、R2/S3クラウドストレージ上のデータを
 * エクスプローラー形式で閲覧・管理する機能を提供します。
 *
 * 提供する機能：
 * - クラウド上の全ゲームデータ一覧取得
 * - 指定したゲームデータの削除
 * - ファイル詳細情報の取得（サイズ、最終更新日時など）
 *
 * 技術的特徴：
 * - ListObjectsV2Command による効率的なオブジェクト一覧取得
 * - DeleteObjectsCommand による一括削除処理
 * - ページネーション対応による大量データの処理
 * - パストラバーサル攻撃対策
 *
 * セキュリティ機能：
 * - 認証情報の事前検証
 * - S3バケットへのアクセス権限確認
 * - 削除操作の安全性検証
 */

import { ipcMain } from "electron"
import { ListObjectsV2Command, DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3"
import { ApiResult } from "../../types/result"
import { withFileOperationErrorHandling } from "../utils/ipcErrorHandler"
import { validateCredentialsForR2 } from "../utils/credentialValidator"
import { logger } from "../utils/logger"
import { CONFIG } from "../../constants/config"

/**
 * クラウドデータアイテムの型定義
 */
export interface CloudDataItem {
  /** ゲーム名/フォルダ名 */
  name: string
  /** 総ファイルサイズ（バイト） */
  totalSize: number
  /** ファイル数 */
  fileCount: number
  /** 最終更新日時 */
  lastModified: Date
  /** リモートパス（削除時に使用） */
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
export interface CloudFileDetail {
  /** ファイル名 */
  name: string
  /** ファイルサイズ（バイト） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** S3オブジェクトキー */
  key: string
  /** 相対パス */
  relativePath: string
}

/**
 * ディレクトリツリーノードの型定義
 */
export interface CloudDirectoryNode {
  /** ノード名 */
  name: string
  /** フルパス */
  path: string
  /** ディレクトリかどうか */
  isDirectory: boolean
  /** ファイルサイズ（ディレクトリの場合は配下の総サイズ） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** 子ノード */
  children?: CloudDirectoryNode[]
  /** S3オブジェクトキー（ファイルの場合） */
  objectKey?: string
}

/**
 * リモートパス配下のすべてのオブジェクトキーとメタデータを取得
 * @param r2Client S3クライアント
 * @param bucketName バケット名
 * @param prefix プレフィックス
 * @returns Promise<Array<{key: string, size: number, lastModified: Date}>>
 */
async function getAllObjectsWithMetadata(
  r2Client: S3Client,
  bucketName: string,
  prefix: string = ""
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const allObjects: Array<{ key: string; size: number; lastModified: Date }> = []
  let token: string | undefined = undefined
  let iterationCount = 0

  do {
    iterationCount++
    if (iterationCount > CONFIG.AWS.MAX_LIST_ITERATIONS) {
      throw new Error(
        `オブジェクト一覧取得でリミットに達しました（${CONFIG.AWS.MAX_LIST_ITERATIONS}回の反復）`
      )
    }
    const listResult = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: token
      })
    )

    listResult.Contents?.forEach((obj) => {
      if (obj.Key && obj.LastModified && obj.Size !== undefined) {
        allObjects.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        })
      }
    })

    token = listResult.NextContinuationToken
  } while (token)

  return allObjects
}

/**
 * フォルダごとにオブジェクトをグループ化
 * @param objects オブジェクト一覧
 * @returns Map<string, Array<object>>
 */
function groupObjectsByFolder(
  objects: Array<{ key: string; size: number; lastModified: Date }>
): Map<string, Array<{ key: string; size: number; lastModified: Date }>> {
  const folderMap = new Map<string, Array<{ key: string; size: number; lastModified: Date }>>()

  objects.forEach((obj) => {
    // ルートレベルのフォルダ名を取得
    const folderName = obj.key.split("/")[0]
    if (!folderName) return

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, [])
    }
    folderMap.get(folderName)!.push(obj)
  })

  return folderMap
}

/**
 * オブジェクト一覧からディレクトリツリーを構築
 * @param objects オブジェクト一覧
 * @returns CloudDirectoryNode[] ディレクトリツリー
 */
function buildDirectoryTree(
  objects: Array<{ key: string; size: number; lastModified: Date }>
): CloudDirectoryNode[] {
  const tree: Map<string, CloudDirectoryNode> = new Map()

  objects.forEach((obj) => {
    const pathParts = obj.key.split("/")
    let currentPath = ""

    pathParts.forEach((part, index) => {
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = index === pathParts.length - 1

      if (!tree.has(currentPath)) {
        const node: CloudDirectoryNode = {
          name: part,
          path: currentPath,
          isDirectory: !isFile,
          size: isFile ? obj.size : 0,
          lastModified: obj.lastModified,
          children: isFile ? undefined : [],
          objectKey: isFile ? obj.key : undefined
        }
        tree.set(currentPath, node)

        // 親ディレクトリに追加
        if (parentPath && tree.has(parentPath)) {
          const parent = tree.get(parentPath)!
          if (parent.children) {
            parent.children.push(node)
          }
        }
      } else {
        // 既存ノードの更新（ディレクトリの場合）
        const existingNode = tree.get(currentPath)!
        if (!isFile) {
          // ディレクトリサイズは後で計算
          existingNode.lastModified = new Date(
            Math.max(existingNode.lastModified.getTime(), obj.lastModified.getTime())
          )
        }
      }
    })
  })

  // ディレクトリサイズを再帰的に計算
  const calculateDirectorySize = (node: CloudDirectoryNode): number => {
    if (!node.isDirectory) {
      return node.size
    }

    let totalSize = 0
    if (node.children) {
      node.children.forEach((child) => {
        totalSize += calculateDirectorySize(child)
      })
    }
    node.size = totalSize
    return totalSize
  }

  // ルートレベルのノードを取得
  const rootNodes: CloudDirectoryNode[] = []
  tree.forEach((node) => {
    if (!node.path.includes("/")) {
      calculateDirectorySize(node)
      rootNodes.push(node)
    }
  })

  // 子ノードをソート
  const sortNodes = (nodes: CloudDirectoryNode[]): void => {
    nodes.sort((a, b) => {
      // ディレクトリを先に、その後ファイル名でソート
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children)
      }
    })
  }

  sortNodes(rootNodes)
  return rootNodes
}

export function registerCloudDataHandlers(): void {
  /**
   * クラウドデータ一覧取得API
   *
   * R2/S3クラウドストレージ上の全ゲームデータをエクスプローラー形式で取得します。
   *
   * @returns ApiResult<CloudDataItem[]> クラウドデータ一覧
   */
  ipcMain.handle(
    "cloud-data-list",
    withFileOperationErrorHandling(async (): Promise<ApiResult<CloudDataItem[]>> => {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      try {
        // バケット内の全オブジェクトを取得
        const allObjects = await getAllObjectsWithMetadata(r2Client, credentials.bucketName)

        // フォルダごとにグループ化
        const folderMap = groupObjectsByFolder(allObjects)

        // CloudDataItem配列を構築
        const cloudDataItems: CloudDataItem[] = []

        for (const [folderName, objects] of folderMap.entries()) {
          // フォルダ内の総サイズを計算
          const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0)

          // 最新の更新日時を取得
          const lastModified = new Date(
            Math.max(...objects.map((obj) => obj.lastModified.getTime()))
          )

          cloudDataItems.push({
            name: folderName,
            totalSize,
            fileCount: objects.length,
            lastModified,
            remotePath: folderName
          })
        }

        // 最終更新日時で降順ソート
        cloudDataItems.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

        return {
          success: true,
          data: cloudDataItems
        }
      } catch (error) {
        logger.error("クラウドデータ一覧取得エラー:", error)
        return {
          success: false,
          message: "クラウドデータの取得に失敗しました"
        }
      }
    })
  )

  /**
   * クラウドデータ削除API
   *
   * 指定したゲーム/フォルダのクラウドデータを完全削除します。
   *
   * @param remotePath 削除対象のリモートパス
   * @returns ApiResult 削除結果
   */
  ipcMain.handle(
    "cloud-data-delete",
    withFileOperationErrorHandling(async (_event, remotePath: string): Promise<ApiResult> => {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      try {
        // パストラバーサル攻撃対策
        if (remotePath.includes("..") || remotePath.startsWith("/")) {
          return {
            success: false,
            message: "不正なパスが指定されました"
          }
        }

        // 削除対象オブジェクトの一覧取得
        const objectsToDelete = await getAllObjectsWithMetadata(
          r2Client,
          credentials.bucketName,
          remotePath + "/"
        )

        if (objectsToDelete.length === 0) {
          return {
            success: false,
            message: "削除対象のデータが見つかりません"
          }
        }

        // DeleteObjectsCommandは最大1000件まで一度に削除可能
        const batchSize = 1000
        const deletePromises: Promise<unknown>[] = []

        for (let i = 0; i < objectsToDelete.length; i += batchSize) {
          const batch = objectsToDelete.slice(i, i + batchSize)

          const deleteCommand = new DeleteObjectsCommand({
            Bucket: credentials.bucketName,
            Delete: {
              Objects: batch.map((obj) => ({ Key: obj.key })),
              Quiet: true // エラー以外の詳細な結果は返さない
            }
          })

          deletePromises.push(r2Client.send(deleteCommand))
        }

        // 全てのバッチを並列実行
        await Promise.all(deletePromises)

        logger.info(`クラウドデータ削除完了: ${remotePath} (${objectsToDelete.length}件)`)

        return {
          success: true
        }
      } catch (error) {
        logger.error("クラウドデータ削除エラー:", error)
        return {
          success: false,
          message: "クラウドデータの削除に失敗しました"
        }
      }
    })
  )

  /**
   * クラウドファイル詳細取得API
   *
   * 指定したフォルダ内の全ファイルの詳細情報を取得します。
   *
   * @param remotePath 対象のリモートパス
   * @returns ApiResult<CloudFileDetail[]> ファイル詳細一覧
   */
  ipcMain.handle(
    "cloud-data-get-folder-files",
    withFileOperationErrorHandling(
      async (_event, remotePath: string): Promise<ApiResult<CloudFileDetail[]>> => {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        try {
          // パストラバーサル攻撃対策
          if (remotePath.includes("..") || remotePath.startsWith("/")) {
            return {
              success: false,
              message: "不正なパスが指定されました"
            }
          }

          // 指定フォルダ内のオブジェクト一覧取得
          const objects = await getAllObjectsWithMetadata(
            r2Client,
            credentials.bucketName,
            remotePath + "/"
          )

          const fileDetails: CloudFileDetail[] = objects.map((obj) => {
            // ファイル名とrelativePathを取得
            const pathParts = obj.key.split("/")
            const fileName = pathParts[pathParts.length - 1]
            const relativePath = obj.key.substring(remotePath.length + 1)

            return {
              name: fileName,
              size: obj.size,
              lastModified: obj.lastModified,
              key: obj.key,
              relativePath
            }
          })

          // ファイル名でソート
          fileDetails.sort((a, b) => a.name.localeCompare(b.name))

          return {
            success: true,
            data: fileDetails
          }
        } catch (error) {
          logger.error("クラウドファイル詳細取得エラー:", error)
          return {
            success: false,
            message: "ファイル詳細の取得に失敗しました"
          }
        }
      }
    )
  )

  /**
   * クラウドディレクトリツリー取得API
   *
   * R2/S3クラウドストレージの階層構造をツリー形式で取得します。
   *
   * @returns ApiResult<CloudDirectoryNode[]> ディレクトリツリー
   */
  ipcMain.handle(
    "cloud-data-get-directory-tree",
    withFileOperationErrorHandling(async (): Promise<ApiResult<CloudDirectoryNode[]>> => {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      try {
        // バケット内の全オブジェクトを取得
        const allObjects = await getAllObjectsWithMetadata(r2Client, credentials.bucketName)

        // ディレクトリツリーを構築
        const directoryTree = buildDirectoryTree(allObjects)

        return {
          success: true,
          data: directoryTree
        }
      } catch (error) {
        logger.error("クラウドディレクトリツリー取得エラー:", error)
        return {
          success: false,
          message: "ディレクトリツリーの取得に失敗しました"
        }
      }
    })
  )

  /**
   * クラウドファイル個別削除API
   *
   * 指定したファイルのクラウドデータを削除します。
   *
   * @param objectKey 削除対象のS3オブジェクトキー
   * @returns ApiResult 削除結果
   */
  ipcMain.handle(
    "cloud-data-delete-file",
    withFileOperationErrorHandling(async (_event, objectKey: string): Promise<ApiResult> => {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      try {
        // パストラバーサル攻撃対策
        if (objectKey.includes("..") || objectKey.startsWith("/")) {
          return {
            success: false,
            message: "不正なパスが指定されました"
          }
        }

        // 単一ファイルを削除
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: credentials.bucketName,
          Delete: {
            Objects: [{ Key: objectKey }],
            Quiet: true
          }
        })

        await r2Client.send(deleteCommand)

        logger.info(`クラウドファイル削除完了: ${objectKey}`)

        return {
          success: true
        }
      } catch (error) {
        logger.error("クラウドファイル削除エラー:", error)
        return {
          success: false,
          message: "ファイルの削除に失敗しました"
        }
      }
    })
  )
}
