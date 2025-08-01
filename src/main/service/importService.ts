/**
 * @fileoverview データインポートサービス
 *
 * このサービスは、解析済みデータをデータベースにインポートする処理を担当します。
 * トランザクション管理とエラーハンドリングを提供し、競合データの処理モード（skip/replace/merge）をサポートします。
 *
 * 主な機能：
 * - 解析済みデータのデータベースインポート
 * - トランザクション内での一括処理
 * - 競合データの処理モード制御
 * - バリデーション機能による不正データの検出・除外
 * - テーブル選択機能による部分インポート
 */

import { prisma as db } from "../db"
import type { ParsedData } from "./dataParserService"
import {
  validateData,
  GameRecordSchema,
  PlaySessionRecordSchema,
  UploadRecordSchema,
  ChapterRecordSchema,
  MemoRecordSchema
} from "./validation/commonSchemas"
import type { ImportOptions, ImportResult } from "../ipcHandlers/dataExportHandlers"
import type { Prisma } from "@prisma/client"

/**
 * ImportService クラス
 */

export class ImportService {
  /**
   * 解析済みデータをデータベースにインポートします
   *
   * @param parsedData 解析済みデータ
   * @param options インポートオプション
   * @returns Promise<ImportResult> インポート結果
   */

  async importData(parsedData: ParsedData, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      totalRecords: 0,
      successfulImports: 0,
      skippedRecords: 0,
      errors: []
    }

    // トランザクション内で実行
    return await db.$transaction(async (tx) => {
      // テーブルごとに処理
      for (const [tableName, records] of Object.entries(parsedData.data)) {
        if (!Array.isArray(records)) continue
        // インポート対象のテーブルかチェック
        if (!this.shouldImportTable(tableName, options)) continue
        for (const record of records) {
          result.totalRecords++
          try {
            const success = await this.importRecord(
              tx,
              tableName,
              record as Record<string, unknown>,
              options
            )
            if (success) {
              result.successfulImports++
            } else {
              result.skippedRecords++
            }
          } catch (error) {
            result.errors.push({
              table: tableName,
              record,
              error: error instanceof Error ? error.message : "不明なエラー"
            })
          }
        }
      }
      return result
    })
  }

  /**
   * テーブルがインポート対象かをチェックします
   *
   * @param tableName テーブル名
   * @param options インポートオプション
   * @returns boolean インポート対象の場合true
   */

  private shouldImportTable(tableName: string, options: ImportOptions): boolean {
    switch (tableName.toLowerCase()) {
      case "games":
        return options.includeGames !== false
      case "playsessions":
        return options.includePlaySessions !== false
      case "uploads":
        return options.includeUploads !== false
      case "chapters":
        return options.includeChapters !== false
      case "memos":
        return options.includeMemos !== false
      default:
        return false
    }
  }

  /**
   * 個別レコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param tableName テーブル名
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */

  private async importRecord(
    tx: Prisma.TransactionClient,
    tableName: string,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    const tableNameLower = tableName.toLowerCase()
    try {
      switch (tableNameLower) {
        case "games":
          return await this.importGameRecord(tx, record, options)
        case "playsessions":
          return await this.importPlaySessionRecord(tx, record, options)
        case "uploads":
          return await this.importUploadRecord(tx, record, options)
        case "chapters":
          return await this.importChapterRecord(tx, record, options)
        case "memos":
          return await this.importMemoRecord(tx, record, options)
        default:
          return false
      }
    } catch (error) {
      console.error(`レコードインポートエラー (${tableName}):`, error)
      throw error
    }
  }

  // テーブル別インポートメソッド

  /**
   * ゲームレコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */
  private async importGameRecord(
    tx: Prisma.TransactionClient,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    // バリデーション実行
    const validation = validateData(GameRecordSchema, record, "game")

    if (!validation.success) {
      const errorMessage = validation.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      throw new Error(`ゲームデータのバリデーションエラー: ${errorMessage}`)
    }

    // バリデーション済みデータを使用
    const validatedRecord = validation.data
    const id = validatedRecord.id

    // 既存レコードをチェック
    const existing = await tx.game.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.game.update({
          where: { id },
          data: {
            title: validatedRecord.title,
            publisher: validatedRecord.publisher || "",
            imagePath: validatedRecord.imagePath || undefined,
            exePath: validatedRecord.exePath,
            saveFolderPath: validatedRecord.saveFolderPath || undefined,
            playStatus: validatedRecord.playStatus,
            totalPlayTime: validatedRecord.totalPlayTime,
            lastPlayed: validatedRecord.lastPlayed || undefined,
            clearedAt: validatedRecord.clearedAt || undefined,
            currentChapter: validatedRecord.currentChapter || undefined
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.game.create({
      data: {
        id,
        title: validatedRecord.title,
        publisher: validatedRecord.publisher || "",
        imagePath: validatedRecord.imagePath || undefined,
        exePath: validatedRecord.exePath,
        saveFolderPath: validatedRecord.saveFolderPath || undefined,
        createdAt: validatedRecord.createdAt || new Date(),
        playStatus: validatedRecord.playStatus,
        totalPlayTime: validatedRecord.totalPlayTime,
        lastPlayed: validatedRecord.lastPlayed || undefined,
        clearedAt: validatedRecord.clearedAt || undefined,
        currentChapter: validatedRecord.currentChapter || undefined
      }
    })
    return true
  }

  /**
   * プレイセッションレコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */

  private async importPlaySessionRecord(
    tx: Prisma.TransactionClient,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    // バリデーション実行
    const validation = validateData(PlaySessionRecordSchema, record, "playSession")

    if (!validation.success) {
      const errorMessage = validation.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      throw new Error(`プレイセッションデータのバリデーションエラー: ${errorMessage}`)
    }

    // バリデーション済みデータを使用
    const validatedRecord = validation.data
    const id = validatedRecord.id
    const gameId = validatedRecord.gameId

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })

    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.playSession.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.playSession.update({
          where: { id },
          data: {
            gameId,
            playedAt: validatedRecord.playedAt,
            duration: validatedRecord.duration,
            sessionName: validatedRecord.sessionName,
            chapterId: validatedRecord.chapterId,
            uploadId: validatedRecord.uploadId
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.playSession.create({
      data: {
        id,
        gameId,
        playedAt: validatedRecord.playedAt,
        duration: validatedRecord.duration,
        sessionName: validatedRecord.sessionName,
        chapterId: validatedRecord.chapterId,
        uploadId: validatedRecord.uploadId
      }
    })
    return true
  }

  /**
   * アップロードレコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */

  private async importUploadRecord(
    tx: Prisma.TransactionClient,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    // バリデーション実行
    const validation = validateData(UploadRecordSchema, record, "upload")

    if (!validation.success) {
      const errorMessage = validation.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      throw new Error(`アップロードデータのバリデーションエラー: ${errorMessage}`)
    }

    // バリデーション済みデータを使用
    const validatedRecord = validation.data
    const id = validatedRecord.id
    const gameId = validatedRecord.gameId

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })

    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.upload.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.upload.update({
          where: { id },
          data: {
            gameId,
            clientId: validatedRecord.clientId,
            comment: validatedRecord.comment,
            createdAt: validatedRecord.createdAt
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.upload.create({
      data: {
        id,
        gameId,
        clientId: validatedRecord.clientId,
        comment: validatedRecord.comment,
        createdAt: validatedRecord.createdAt
      }
    })
    return true
  }

  /**
   * チャプターレコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */

  private async importChapterRecord(
    tx: Prisma.TransactionClient,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    // バリデーション実行
    const validation = validateData(ChapterRecordSchema, record, "chapter")

    if (!validation.success) {
      const errorMessage = validation.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      throw new Error(`チャプターデータのバリデーションエラー: ${errorMessage}`)
    }

    // バリデーション済みデータを使用
    const validatedRecord = validation.data
    const id = validatedRecord.id
    const gameId = validatedRecord.gameId

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })

    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.chapter.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.chapter.update({
          where: { id },
          data: {
            gameId,
            name: validatedRecord.name,
            order: validatedRecord.order,
            createdAt: validatedRecord.createdAt
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.chapter.create({
      data: {
        id,
        gameId,
        name: validatedRecord.name,
        order: validatedRecord.order,
        createdAt: validatedRecord.createdAt
      }
    })
    return true
  }

  /**
   * メモレコードをインポートします
   *
   * @param tx トランザクションクライアント
   * @param record レコードデータ
   * @param options インポートオプション
   * @returns Promise<boolean> 成功した場合true、スキップした場合false
   */

  private async importMemoRecord(
    tx: Prisma.TransactionClient,
    record: Record<string, unknown>,
    options: ImportOptions
  ): Promise<boolean> {
    // バリデーション実行
    const validation = validateData(MemoRecordSchema, record, "memo")

    if (!validation.success) {
      const errorMessage = validation.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      throw new Error(`メモデータのバリデーションエラー: ${errorMessage}`)
    }

    // バリデーション済みデータを使用
    const validatedRecord = validation.data
    const id = validatedRecord.id
    const gameId = validatedRecord.gameId

    // ゲームが存在するかチェック
    const gameExists = await tx.game.findUnique({ where: { id: gameId } })

    if (!gameExists) {
      throw new Error(`ゲームID ${gameId} が存在しません`)
    }

    // 既存レコードをチェック
    const existing = await tx.memo.findUnique({ where: { id } })

    if (existing) {
      if (options.mode === "skip") {
        return false
      } else if (options.mode === "replace" || options.mode === "merge") {
        // replaceとmergeモードの場合は既存データを更新
        await tx.memo.update({
          where: { id },
          data: {
            gameId,
            title: validatedRecord.title,
            content: validatedRecord.content,
            createdAt: validatedRecord.createdAt,
            updatedAt: validatedRecord.updatedAt
          }
        })
        return true
      }
    }

    // 新規作成（既存レコードがない場合のみ）
    await tx.memo.create({
      data: {
        id,
        gameId,
        title: validatedRecord.title,
        content: validatedRecord.content,
        createdAt: validatedRecord.createdAt,
        updatedAt: validatedRecord.updatedAt
      }
    })
    return true
  }
}

// シングルトンインスタンス

export const importService = new ImportService()
