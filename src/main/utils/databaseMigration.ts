/**
 * @fileoverview データベースマイグレーション管理ユーティリティ
 *
 * 本番環境でのデータベーススキーマ更新を安全に実行するためのユーティリティです。
 * P2022エラー対策として、データベースの整合性チェックとマイグレーション実行機能を提供します。
 */

import * as fs from "fs"

import { logger } from "./logger"
import type { PrismaClient } from "@prisma/client"

/**
 * データベースの整合性チェックを実行
 * @param prismaClient PrismaClientインスタンス
 * @returns boolean 整合性チェック結果
 */
export async function checkDatabaseIntegrity(prismaClient: PrismaClient): Promise<boolean> {
  try {
    // 基本的なテーブル存在チェック
    await prismaClient.game.count()
    await prismaClient.playSession.count()
    await prismaClient.chapter.count()
    await prismaClient.memo.count()
    await prismaClient.upload.count()

    logger.info("データベース整合性チェック成功")
    return true
  } catch (error) {
    logger.error("データベース整合性チェック失敗", {
      error: error instanceof Error ? error.message : String(error)
    })
    return false
  }
}

/**
 * 古いデータベースファイルの削除（P2022エラー対策）
 * @param dbPath データベースファイルパス
 * @returns Promise<boolean> 削除実行結果
 */
export async function cleanupOldDatabase(dbPath: string): Promise<boolean> {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
      logger.info("古いデータベースファイルを削除しました", { dbPath })
      return true
    }
    return true
  } catch (error) {
    logger.error("古いデータベースファイルの削除に失敗しました", {
      error: error instanceof Error ? error.message : String(error),
      dbPath
    })
    return false
  }
}
