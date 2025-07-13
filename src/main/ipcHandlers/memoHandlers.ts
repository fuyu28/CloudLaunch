/**
 * @fileoverview メモ管理に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのメモ操作リクエストを処理します。
 * - ゲームに関連するメモ一覧の取得
 * - メモの詳細情報の取得
 * - メモの作成・更新・削除
 *
 * すべての操作はPrismaを通してSQLiteデータベースに対して実行されます。
 * メモはゲームと1対多の関係で、特定のゲームに紐づく形で管理されます。
 */

import { ipcMain } from "electron"
import { createHash } from "crypto"
import { prisma } from "../db"
import type { ApiResult } from "../../types/result"
import type {
  MemoType,
  CreateMemoData,
  UpdateMemoData,
  CloudMemoInfo,
  MemoSyncResult
} from "../../types/memo"
import { logger } from "../utils/logger"
import { memoFileManager } from "../utils/memoFileManager"
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { validateCredentialsForR2 } from "../utils/credentialValidator"

/**
 * メモ内容のSHA256ハッシュを計算します
 * @param content メモ内容
 * @returns SHA256ハッシュ値（16進数文字列）
 */
function calculateContentHash(content: string): string {
  return createHash("sha256").update(content.trim(), "utf8").digest("hex")
}

/**
 * クラウドメモファイルから実際のメモ内容を抽出します
 * @param fileContent クラウドから取得したファイル内容
 * @returns メタデータを除去した実際のメモ内容
 */
function extractMemoContent(fileContent: string): string {
  const lines = fileContent.split("\n")
  let actualContent = ""
  let foundContentStart = false

  for (const line of lines) {
    if (line.startsWith("#") && !foundContentStart) {
      continue // タイトル行をスキップ
    }
    if (line.startsWith("<!--") || line.startsWith("-->")) {
      continue // コメント行をスキップ
    }
    if (line.trim() === "" && !foundContentStart) {
      continue // 内容開始前の空行をスキップ
    }
    foundContentStart = true
    actualContent += line + "\n"
  }

  return actualContent.trim()
}

export function registerMemoHandlers(): void {
  // メモファイルマネージャーの初期化
  memoFileManager.initializeBaseDir().catch((error) => {
    logger.error("メモファイルマネージャー初期化エラー:", error)
  })
  /**
   * 指定されたゲームのメモ一覧を取得します
   * @param gameId ゲームID
   * @returns メモ一覧
   */
  ipcMain.handle(
    "memo:getMemosByGameId",
    async (_, gameId: string): Promise<ApiResult<MemoType[]>> => {
      try {
        const memos = await prisma.memo.findMany({
          where: { gameId },
          orderBy: { updatedAt: "desc" }
        })

        return { success: true, data: memos }
      } catch (error) {
        logger.error("メモ一覧取得エラー:", error)
        return { success: false, message: "メモ一覧の取得に失敗しました" }
      }
    }
  )

  /**
   * 指定されたIDのメモを取得します
   * @param memoId メモID
   * @returns メモデータ
   */
  ipcMain.handle(
    "memo:getMemoById",
    async (_, memoId: string): Promise<ApiResult<MemoType | null>> => {
      try {
        const memo = await prisma.memo.findUnique({
          where: { id: memoId }
        })

        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ取得エラー:", error)
        return { success: false, message: "メモの取得に失敗しました" }
      }
    }
  )

  /**
   * 新しいメモを作成します
   * @param memoData メモ作成データ
   * @returns 作成されたメモ
   */
  ipcMain.handle(
    "memo:createMemo",
    async (_, memoData: CreateMemoData): Promise<ApiResult<MemoType>> => {
      try {
        // ゲームの存在確認
        const game = await prisma.game.findUnique({
          where: { id: memoData.gameId }
        })

        if (!game) {
          return { success: false, message: "指定されたゲームが見つかりません" }
        }

        const memo = await prisma.memo.create({
          data: memoData
        })

        // メモファイルを作成
        const fileResult = await memoFileManager.createMemoFile(
          memo.gameId,
          memo.id,
          memo.title,
          memo.content
        )
        if (!fileResult.success) {
          logger.warn("メモファイル作成エラー (データベース作成は成功):", fileResult.error)
        }

        logger.info(`メモを作成しました: ${memo.title}`)
        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ作成エラー:", error)
        return { success: false, message: "メモの作成に失敗しました" }
      }
    }
  )

  /**
   * メモを更新します
   * @param memoId メモID
   * @param updateData 更新データ
   * @returns 更新されたメモ
   */
  ipcMain.handle(
    "memo:updateMemo",
    async (_, memoId: string, updateData: UpdateMemoData): Promise<ApiResult<MemoType>> => {
      try {
        // 更新前のメモ情報を取得
        const oldMemo = await prisma.memo.findUnique({
          where: { id: memoId }
        })

        if (!oldMemo) {
          return { success: false, message: "メモが見つかりません" }
        }

        const memo = await prisma.memo.update({
          where: { id: memoId },
          data: updateData
        })

        // メモファイルを更新
        const fileResult = await memoFileManager.updateMemoFile(
          memo.gameId,
          memo.id,
          oldMemo.title,
          memo.title,
          memo.content
        )
        if (!fileResult.success) {
          logger.warn("メモファイル更新エラー (データベース更新は成功):", fileResult.error)
        }

        logger.info(`メモを更新しました: ${memo.title}`)
        return { success: true, data: memo }
      } catch (error) {
        logger.error("メモ更新エラー:", error)
        return { success: false, message: "メモの更新に失敗しました" }
      }
    }
  )

  /**
   * メモを削除します
   * @param memoId メモID
   * @returns 削除結果
   */
  ipcMain.handle("memo:deleteMemo", async (_, memoId: string): Promise<ApiResult<boolean>> => {
    try {
      // 削除前のメモ情報を取得
      const memo = await prisma.memo.findUnique({
        where: { id: memoId }
      })

      if (!memo) {
        return { success: false, message: "メモが見つかりません" }
      }

      await prisma.memo.delete({
        where: { id: memoId }
      })

      // メモファイルを削除
      const fileResult = await memoFileManager.deleteMemoFile(memo.gameId, memo.id, memo.title)
      if (!fileResult.success) {
        logger.warn("メモファイル削除エラー (データベース削除は成功):", fileResult.error)
      }

      logger.info(`メモを削除しました: ${memoId}`)
      return { success: true, data: true }
    } catch (error) {
      logger.error("メモ削除エラー:", error)
      return { success: false, message: "メモの削除に失敗しました" }
    }
  })

  /**
   * メモファイルのパスを取得します（エクスプローラーで開く用）
   * @param memoId メモID
   * @returns ファイルパス
   */
  ipcMain.handle("memo:getMemoFilePath", async (_, memoId: string): Promise<ApiResult<string>> => {
    try {
      const memo = await prisma.memo.findUnique({
        where: { id: memoId }
      })

      if (!memo) {
        return { success: false, message: "メモが見つかりません" }
      }

      const filePath = memoFileManager.getMemoFilePathForReading(memo.gameId, memo.id, memo.title)

      return { success: true, data: filePath }
    } catch (error) {
      logger.error("メモファイルパス取得エラー:", error)
      return { success: false, message: "メモファイルパスの取得に失敗しました" }
    }
  })

  /**
   * ゲームのメモディレクトリパスを取得します
   * @param gameId ゲームID
   * @returns ディレクトリパス
   */
  ipcMain.handle("memo:getGameMemoDir", async (_, gameId: string): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoFileManager.getGameMemoDirPath(gameId)
      return { success: true, data: dirPath }
    } catch (error) {
      logger.error("ゲームメモディレクトリパス取得エラー:", error)
      return { success: false, message: "ディレクトリパスの取得に失敗しました" }
    }
  })

  /**
   * すべてのメモ一覧を取得します（ゲーム名付き）
   * @returns メモ一覧
   */
  ipcMain.handle("memo:getAllMemos", async (): Promise<ApiResult<MemoType[]>> => {
    try {
      const memos = await prisma.memo.findMany({
        include: {
          game: {
            select: {
              title: true
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      })

      const memosWithGameTitle = memos.map((memo) => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        gameId: memo.gameId,
        gameTitle: memo.game.title,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt
      }))

      return { success: true, data: memosWithGameTitle }
    } catch (error) {
      logger.error("全メモ一覧取得エラー:", error)
      return { success: false, message: "メモ一覧の取得に失敗しました" }
    }
  })

  /**
   * メモルートディレクトリパスを取得します
   * @returns ディレクトリパス
   */
  ipcMain.handle("memo:getMemoRootDir", async (): Promise<ApiResult<string>> => {
    try {
      const dirPath = memoFileManager.getBaseDir()
      return { success: true, data: dirPath }
    } catch (error) {
      logger.error("メモルートディレクトリパス取得エラー:", error)
      return { success: false, message: "ディレクトリパスの取得に失敗しました" }
    }
  })

  /**
   * メモをクラウドストレージに保存します
   * @param memoId メモID
   * @returns 保存結果
   */
  ipcMain.handle(
    "memo:uploadMemoToCloud",
    async (_, memoId: string): Promise<ApiResult<boolean>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // メモ情報を取得
        const memo = await prisma.memo.findUnique({
          where: { id: memoId },
          include: {
            game: {
              select: {
                title: true
              }
            }
          }
        })

        if (!memo) {
          return { success: false, message: "メモが見つかりません" }
        }

        // S3キーを作成: games/[ゲームタイトル]/memo/[メモタイトル]_[メモID].md
        const sanitizedGameTitle = memo.game.title.replace(/[<>:"/\\|?*]/g, "_")
        const sanitizedMemoTitle = memo.title.replace(/[<>:"/\\|?*]/g, "_")
        const s3Key = `games/${sanitizedGameTitle}/memo/${sanitizedMemoTitle}_${memo.id}.md`

        // メモファイル内容を生成
        const timestamp = new Date().toISOString()
        const fileContent = `# ${memo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${memo.game.title} -->

${memo.content}
`

        // クラウドに保存
        const command = new PutObjectCommand({
          Bucket: credentials.bucketName,
          Key: s3Key,
          Body: fileContent,
          ContentType: "text/markdown"
        })

        await r2Client.send(command)

        logger.info(`メモをクラウドに保存しました: ${s3Key}`)
        return { success: true, data: true }
      } catch (error) {
        logger.error("メモクラウド保存エラー:", error)
        return { success: false, message: "メモのクラウド保存に失敗しました" }
      }
    }
  )

  /**
   * クラウドストレージからメモをダウンロードします
   * @param gameTitle ゲームタイトル
   * @param memoFileName メモファイル名（メモタイトル_メモID.md）
   * @returns ダウンロード結果
   */
  ipcMain.handle(
    "memo:downloadMemoFromCloud",
    async (_, gameTitle: string, memoFileName: string): Promise<ApiResult<string>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // S3キーを作成
        const sanitizedGameTitle = gameTitle.replace(/[<>:"/\\|?*]/g, "_")
        const s3Key = `games/${sanitizedGameTitle}/memo/${memoFileName}`

        // クラウドからダウンロード
        const command = new GetObjectCommand({
          Bucket: credentials.bucketName,
          Key: s3Key
        })

        const response = await r2Client.send(command)
        const content = await response.Body?.transformToString()

        if (!content) {
          return { success: false, message: "メモ内容が取得できませんでした" }
        }

        logger.info(`メモをクラウドからダウンロードしました: ${s3Key}`)
        return { success: true, data: content }
      } catch (error) {
        logger.error("メモクラウドダウンロードエラー:", error)
        return { success: false, message: "メモのクラウドダウンロードに失敗しました" }
      }
    }
  )

  /**
   * クラウドストレージからメモ一覧を取得します
   * @returns クラウドメモ一覧
   */
  ipcMain.handle("memo:getCloudMemos", async (): Promise<ApiResult<CloudMemoInfo[]>> => {
    try {
      // 認証情報の検証とR2クライアントの作成
      const validationResult = await validateCredentialsForR2()
      if (!validationResult.success) {
        return validationResult
      }

      const { credentials, r2Client } = validationResult.data!

      // games/*/memo/ 配下のメモファイルを一覧取得
      const command = new ListObjectsV2Command({
        Bucket: credentials.bucketName,
        Prefix: "games/",
        Delimiter: ""
      })

      const response = await r2Client.send(command)
      const cloudMemos: CloudMemoInfo[] = []

      if (response.Contents) {
        for (const object of response.Contents) {
          if (!object.Key || !object.Key.includes("/memo/") || !object.Key.endsWith(".md")) {
            continue
          }

          // games/[gameTitle]/memo/[memoTitle]_[memoId].md の形式から情報を抽出
          const keyParts = object.Key.split("/")
          if (keyParts.length < 4 || keyParts[0] !== "games" || keyParts[2] !== "memo") {
            continue
          }

          const gameTitle = keyParts[1]
          const fileName = keyParts[3]
          const fileBaseName = fileName.replace(".md", "")

          // ファイル名から memoId を抽出（最後の_以降）
          const lastUnderscoreIndex = fileBaseName.lastIndexOf("_")
          if (lastUnderscoreIndex === -1) {
            continue
          }

          const memoTitle = fileBaseName.substring(0, lastUnderscoreIndex)
          const memoId = fileBaseName.substring(lastUnderscoreIndex + 1)

          cloudMemos.push({
            key: object.Key,
            fileName,
            gameTitle,
            memoTitle,
            memoId,
            lastModified: object.LastModified || new Date(),
            size: object.Size || 0
          })
        }
      }

      logger.info(`クラウドメモ一覧を取得しました: ${cloudMemos.length}件`)
      return { success: true, data: cloudMemos }
    } catch (error) {
      logger.error("クラウドメモ一覧取得エラー:", error)
      return { success: false, message: "クラウドメモ一覧の取得に失敗しました" }
    }
  })

  /**
   * クラウドストレージからメモを同期します
   * @param gameId 特定のゲームのみ同期する場合のゲームID（オプション）
   * @returns 同期結果
   */
  ipcMain.handle(
    "memo:syncMemosFromCloud",
    async (_, gameId?: string): Promise<ApiResult<MemoSyncResult>> => {
      try {
        // 認証情報の検証とR2クライアントの作成
        const validationResult = await validateCredentialsForR2()
        if (!validationResult.success) {
          return validationResult
        }

        const { credentials, r2Client } = validationResult.data!

        // クラウドメモ一覧を取得
        const cloudMemosCommand = new ListObjectsV2Command({
          Bucket: credentials.bucketName,
          Prefix: "games/",
          Delimiter: ""
        })

        const cloudMemosResponse = await r2Client.send(cloudMemosCommand)
        const allCloudMemos: CloudMemoInfo[] = []

        if (cloudMemosResponse.Contents) {
          for (const object of cloudMemosResponse.Contents) {
            if (!object.Key || !object.Key.includes("/memo/") || !object.Key.endsWith(".md")) {
              continue
            }

            // games/[gameTitle]/memo/[memoTitle]_[memoId].md の形式から情報を抽出
            const keyParts = object.Key.split("/")
            if (keyParts.length < 4 || keyParts[0] !== "games" || keyParts[2] !== "memo") {
              continue
            }

            const gameTitle = keyParts[1]
            const fileName = keyParts[3]
            const fileBaseName = fileName.replace(".md", "")

            // ファイル名から memoId を抽出（最後の_以降）
            const lastUnderscoreIndex = fileBaseName.lastIndexOf("_")
            if (lastUnderscoreIndex === -1) {
              continue
            }

            const memoTitle = fileBaseName.substring(0, lastUnderscoreIndex)
            const memoIdFromFile = fileBaseName.substring(lastUnderscoreIndex + 1)

            allCloudMemos.push({
              key: object.Key,
              fileName,
              gameTitle,
              memoTitle,
              memoId: memoIdFromFile,
              lastModified: object.LastModified || new Date(),
              size: object.Size || 0
            })
          }
        }

        let cloudMemos = allCloudMemos

        // 特定のゲームのみ同期する場合はフィルタリング
        if (gameId) {
          const game = await prisma.game.findUnique({ where: { id: gameId } })
          if (!game) {
            return { success: false, message: "指定されたゲームが見つかりません" }
          }
          const sanitizedGameTitle = game.title.replace(/[<>:"/\\|?*]/g, "_")
          cloudMemos = cloudMemos.filter((memo) => memo.gameTitle === sanitizedGameTitle)
        }

        const syncResult: MemoSyncResult = {
          success: true,
          uploaded: 0,
          localOverwritten: 0,
          cloudOverwritten: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          details: []
        }

        // 処理済みメモを追跡するためのSet（重複処理を防ぐため）
        const processedMemos = new Set<string>()

        // 1. まず、ローカルのメモをクラウドにアップロード
        let localMemos: Array<{
          id: string
          title: string
          content: string
          game: { title: string }
        }> = []
        if (gameId) {
          // 特定のゲームのメモのみ
          localMemos = await prisma.memo.findMany({
            where: { gameId },
            include: { game: { select: { title: true } } }
          })
        } else {
          // 全てのメモ
          localMemos = await prisma.memo.findMany({
            include: { game: { select: { title: true } } }
          })
        }

        // ローカルメモをクラウドにアップロード
        for (const localMemo of localMemos) {
          try {
            const sanitizedGameTitle = localMemo.game.title.replace(/[<>:"/\\|?*]/g, "_")
            const sanitizedMemoTitle = localMemo.title.replace(/[<>:"/\\|?*]/g, "_")
            const s3Key = `games/${sanitizedGameTitle}/memo/${sanitizedMemoTitle}_${localMemo.id}.md`

            // クラウドに既に存在するかチェック
            const existingCloudMemo = cloudMemos.find(
              (cloudMemo) =>
                cloudMemo.memoId === localMemo.id && cloudMemo.gameTitle === sanitizedGameTitle
            )

            if (!existingCloudMemo) {
              // 新規アップロード
              const timestamp = new Date().toISOString()
              const fileContent = `# ${localMemo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${localMemo.game.title} -->

${localMemo.content}
`

              const uploadCommand = new PutObjectCommand({
                Bucket: credentials.bucketName,
                Key: s3Key,
                Body: fileContent,
                ContentType: "text/markdown"
              })

              await r2Client.send(uploadCommand)
              syncResult.uploaded++
              syncResult.details.push(`アップロード: ${localMemo.title}`)

              // 処理済みとしてマーク
              const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
              processedMemos.add(memoKey)
            } else {
              // 既存のクラウドメモが存在する場合、タイムスタンプを比較
              const localMemoData = await prisma.memo.findUnique({
                where: { id: localMemo.id }
              })

              if (!localMemoData) {
                syncResult.skipped++
                syncResult.details.push(
                  `ローカルメモが見つからないためスキップ: ${localMemo.title}`
                )
                // 処理済みとしてマーク
                const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
                processedMemos.add(memoKey)
              } else if (localMemoData.updatedAt > existingCloudMemo.lastModified) {
                // ローカルの方が新しい場合、内容比較してからクラウドを更新

                // まずクラウドの内容を取得してハッシュ比較
                const downloadCommand = new GetObjectCommand({
                  Bucket: credentials.bucketName,
                  Key: existingCloudMemo.key
                })

                const downloadResponse = await r2Client.send(downloadCommand)
                const cloudContent = await downloadResponse.Body?.transformToString()

                if (cloudContent) {
                  const cloudActualContent = extractMemoContent(cloudContent)
                  const localContentHash = calculateContentHash(localMemoData.content)
                  const cloudContentHash = calculateContentHash(cloudActualContent)

                  if (localContentHash === cloudContentHash) {
                    // 内容が同じ場合はスキップ
                    syncResult.skipped++
                    syncResult.details.push(`スキップ: ${localMemo.title} (内容が同じ)`)

                    // 処理済みとしてマーク
                    const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
                    processedMemos.add(memoKey)
                  } else {
                    // 内容が異なる場合はクラウドを更新
                    const timestamp = new Date().toISOString()
                    const fileContent = `# ${localMemo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${localMemo.game.title} -->

${localMemo.content}
`

                    const uploadCommand = new PutObjectCommand({
                      Bucket: credentials.bucketName,
                      Key: s3Key,
                      Body: fileContent,
                      ContentType: "text/markdown"
                    })

                    await r2Client.send(uploadCommand)
                    syncResult.cloudOverwritten++
                    syncResult.details.push(`クラウド更新: ${localMemo.title} (ローカル版が新しい)`)

                    // 処理済みとしてマーク
                    const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
                    processedMemos.add(memoKey)
                  }
                } else {
                  // クラウド内容が取得できない場合は通常のアップロード
                  const timestamp = new Date().toISOString()
                  const fileContent = `# ${localMemo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${localMemo.game.title} -->

${localMemo.content}
`

                  const uploadCommand = new PutObjectCommand({
                    Bucket: credentials.bucketName,
                    Key: s3Key,
                    Body: fileContent,
                    ContentType: "text/markdown"
                  })

                  await r2Client.send(uploadCommand)
                  syncResult.cloudOverwritten++
                  syncResult.details.push(`クラウド更新: ${localMemo.title} (クラウド内容取得失敗)`)

                  // 処理済みとしてマーク
                  const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
                  processedMemos.add(memoKey)
                }
              } else if (existingCloudMemo.lastModified > localMemoData.updatedAt) {
                // クラウドの方が新しい場合は、ここでは何もせず、
                // この後のダウンロード処理でローカルを更新する
                // 処理済みとしてはマークしない（ダウンロード処理で処理するため）
                syncResult.details.push(
                  `ダウンロード処理待ち: ${localMemo.title} (クラウド版が新しい)`
                )
              } else {
                // タイムスタンプが同じ場合、ハッシュで内容比較
                const downloadCommand = new GetObjectCommand({
                  Bucket: credentials.bucketName,
                  Key: existingCloudMemo.key
                })

                const downloadResponse = await r2Client.send(downloadCommand)
                const cloudContent = await downloadResponse.Body?.transformToString()

                if (cloudContent) {
                  const cloudActualContent = extractMemoContent(cloudContent)
                  const localContentHash = calculateContentHash(localMemoData.content)
                  const cloudContentHash = calculateContentHash(cloudActualContent)

                  if (localContentHash === cloudContentHash) {
                    // 内容が同じ場合はスキップ
                    syncResult.skipped++
                    syncResult.details.push(`スキップ: ${localMemo.title} (内容が同じ)`)
                  } else {
                    // 内容が異なるがタイムスタンプが同じ場合、ローカル優先でクラウドを更新
                    const timestamp = new Date().toISOString()
                    const fileContent = `# ${localMemo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${localMemo.game.title} -->

${localMemo.content}
`

                    const uploadCommand = new PutObjectCommand({
                      Bucket: credentials.bucketName,
                      Key: s3Key,
                      Body: fileContent,
                      ContentType: "text/markdown"
                    })

                    await r2Client.send(uploadCommand)
                    syncResult.cloudOverwritten++
                    syncResult.details.push(
                      `クラウド更新: ${localMemo.title} (同じタイムスタンプ・内容異なる)`
                    )
                  }
                } else {
                  // クラウド内容が取得できない場合はスキップ
                  syncResult.skipped++
                  syncResult.details.push(`スキップ: ${localMemo.title} (クラウド内容取得失敗)`)
                }

                // 処理済みとしてマーク
                const memoKey = `${sanitizedGameTitle}:${localMemo.id}`
                processedMemos.add(memoKey)
              }
            }
          } catch (error) {
            logger.error(`メモアップロードエラー: ${localMemo.title}`, error)
            syncResult.details.push(`アップロードエラー: ${localMemo.title} - ${error}`)
          }
        }

        // 2. 次に、クラウドのメモをローカルにダウンロード
        for (const cloudMemo of cloudMemos) {
          try {
            // 既に処理済みかチェック（重複処理を防ぐ）
            const memoKey = `${cloudMemo.gameTitle}:${cloudMemo.memoId}`
            if (processedMemos.has(memoKey)) {
              // 既にローカル→クラウド処理で処理済みの場合はスキップ
              continue
            }

            // ゲームを検索または作成（ゲームタイトルから）
            const game = await prisma.game.findFirst({
              where: {
                title: {
                  contains: cloudMemo.gameTitle.replace(/_/g, " ")
                }
              }
            })

            if (!game) {
              // ゲームが見つからない場合はスキップ
              syncResult.skipped++
              syncResult.details.push(
                `ゲーム「${cloudMemo.gameTitle}」が見つからないためスキップ: ${cloudMemo.memoTitle}`
              )
              continue
            }

            // メモ内容をダウンロード
            const downloadCommand = new GetObjectCommand({
              Bucket: credentials.bucketName,
              Key: cloudMemo.key
            })

            const downloadResponse = await r2Client.send(downloadCommand)
            const content = await downloadResponse.Body?.transformToString()

            if (!content) {
              syncResult.skipped++
              syncResult.details.push(`内容が取得できないためスキップ: ${cloudMemo.memoTitle}`)
              continue
            }

            // メモ内容からメタデータを除去
            const actualContent = extractMemoContent(content)

            // 既存のメモを確認
            const existingMemo = await prisma.memo.findFirst({
              where: {
                gameId: game.id,
                title: cloudMemo.memoTitle
              }
            })

            if (existingMemo) {
              // タイムスタンプを比較して、より新しいバージョンを判定
              const localUpdatedAt = existingMemo.updatedAt
              const cloudLastModified = cloudMemo.lastModified

              if (cloudLastModified > localUpdatedAt) {
                // クラウドの方が新しい場合、まずハッシュで内容比較
                const localContentHash = calculateContentHash(existingMemo.content)
                const cloudContentHash = calculateContentHash(actualContent)

                if (localContentHash === cloudContentHash) {
                  // 内容が同じ場合はスキップ
                  syncResult.skipped++
                  syncResult.details.push(`スキップ: ${cloudMemo.memoTitle} (内容が同じ)`)
                } else {
                  // 内容が異なる場合、ローカルを更新
                  await prisma.memo.update({
                    where: { id: existingMemo.id },
                    data: {
                      content: actualContent,
                      updatedAt: new Date()
                    }
                  })

                  // ローカルファイルも更新
                  await memoFileManager.updateMemoFile(
                    game.id,
                    existingMemo.id,
                    existingMemo.title,
                    cloudMemo.memoTitle,
                    actualContent
                  )

                  syncResult.localOverwritten++
                  syncResult.details.push(
                    `ローカル更新: ${cloudMemo.memoTitle} (クラウド版が新しい)`
                  )
                }
              } else if (localUpdatedAt > cloudLastModified) {
                // ローカルの方が新しい場合、まずハッシュで内容比較
                const localContentHash = calculateContentHash(existingMemo.content)
                const cloudContentHash = calculateContentHash(actualContent)

                if (localContentHash === cloudContentHash) {
                  // 内容が同じ場合はスキップ
                  syncResult.skipped++
                  syncResult.details.push(`スキップ: ${cloudMemo.memoTitle} (内容が同じ)`)
                } else {
                  // 内容が異なる場合、クラウドを更新
                  const sanitizedGameTitle = game.title.replace(/[<>:"/\\|?*]/g, "_")
                  const sanitizedMemoTitle = existingMemo.title.replace(/[<>:"/\\|?*]/g, "_")
                  const s3Key = `games/${sanitizedGameTitle}/memo/${sanitizedMemoTitle}_${existingMemo.id}.md`

                  // メモファイル内容を生成
                  const timestamp = new Date().toISOString()
                  const fileContent = `# ${existingMemo.title}

<!-- Created: ${timestamp} -->
<!-- Generated by CloudLaunch -->
<!-- Game: ${game.title} -->

${existingMemo.content}
`

                  // クラウドに保存
                  const uploadCommand = new PutObjectCommand({
                    Bucket: credentials.bucketName,
                    Key: s3Key,
                    Body: fileContent,
                    ContentType: "text/markdown"
                  })

                  await r2Client.send(uploadCommand)
                  syncResult.cloudOverwritten++
                  syncResult.details.push(
                    `クラウド更新: ${existingMemo.title} (ローカル版が新しい)`
                  )
                }
              } else {
                // タイムスタンプが同じ場合、ハッシュで内容比較
                const localContentHash = calculateContentHash(existingMemo.content)
                const cloudContentHash = calculateContentHash(actualContent)

                if (localContentHash === cloudContentHash) {
                  // 内容が同じ場合はスキップ
                  syncResult.skipped++
                  syncResult.details.push(`スキップ: ${cloudMemo.memoTitle} (内容が同じ)`)
                } else {
                  // 内容が異なる場合、ローカル優先で更新（タイムスタンプが同じなので）
                  await prisma.memo.update({
                    where: { id: existingMemo.id },
                    data: {
                      content: actualContent,
                      updatedAt: new Date()
                    }
                  })

                  // ローカルファイルも更新
                  await memoFileManager.updateMemoFile(
                    game.id,
                    existingMemo.id,
                    existingMemo.title,
                    cloudMemo.memoTitle,
                    actualContent
                  )

                  syncResult.localOverwritten++
                  syncResult.details.push(
                    `ローカル更新: ${cloudMemo.memoTitle} (同じタイムスタンプ・内容異なる)`
                  )
                }
              }
            } else {
              // 新しいメモを作成
              const newMemo = await prisma.memo.create({
                data: {
                  title: cloudMemo.memoTitle,
                  content: actualContent,
                  gameId: game.id
                }
              })

              // ローカルファイルを作成
              await memoFileManager.createMemoFile(
                game.id,
                newMemo.id,
                newMemo.title,
                actualContent
              )

              syncResult.created++
              syncResult.details.push(`作成: ${cloudMemo.memoTitle}`)
            }
          } catch (error) {
            logger.error(`メモ同期エラー: ${cloudMemo.memoTitle}`, error)
            syncResult.details.push(`エラー: ${cloudMemo.memoTitle} - ${error}`)
          }
        }

        logger.info(
          `メモ同期完了: アップロード${syncResult.uploaded}件、作成${syncResult.created}件、ローカル上書き${syncResult.localOverwritten}件、クラウド上書き${syncResult.cloudOverwritten}件、スキップ${syncResult.skipped}件`
        )
        logger.debug("syncResult:", syncResult) // デバッグ用ログ

        // 明示的にMemoSyncResultオブジェクトを作成して返す
        const result: MemoSyncResult = {
          success: syncResult.success,
          uploaded: syncResult.uploaded,
          localOverwritten: syncResult.localOverwritten,
          cloudOverwritten: syncResult.cloudOverwritten,
          created: syncResult.created,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          details: syncResult.details
        }

        return { success: true, data: result }
      } catch (error) {
        logger.error("メモ同期エラー:", error)
        return { success: false, message: "メモの同期に失敗しました" }
      }
    }
  )
}
