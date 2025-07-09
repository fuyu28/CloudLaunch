/**
 * @fileoverview データ変換ユーティリティ
 *
 * Prismaのnullをundefinedに変換するなど、
 * バックエンドとフロントエンド間のデータ変換を行います。
 */

import type { Game, PlaySession, Upload } from "@prisma/client"
import type { GameType, PlaySessionType } from "../../types/game.d"

/**
 * nullをundefinedに変換するヘルパー関数
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * Prisma GameをフロントエンドのGameTypeに変換
 */
export function transformGame(game: Game): GameType {
  return {
    ...game,
    imagePath: nullToUndefined(game.imagePath), // undefined - オプショナル設定
    saveFolderPath: nullToUndefined(game.saveFolderPath), // undefined - オプショナル設定
    lastPlayed: game.lastPlayed, // null - 明確な「未プレイ」状態
    clearedAt: game.clearedAt, // null - 明確な「未クリア」状態
    currentChapter: game.currentChapter // null - 明確な「未選択」状態
  }
}

/**
 * Prisma PlaySessionをフロントエンドのPlaySessionTypeに変換
 * チャプター情報を含むPlaySessionを変換
 */
export function transformPlaySession(
  session: PlaySession & { chapter?: { id: string; name: string; order: number } | null }
): PlaySessionType {
  return {
    id: session.id,
    sessionName: nullToUndefined(session.sessionName), // undefined - オプショナル情報
    playedAt: session.playedAt,
    duration: session.duration,
    gameId: session.gameId,
    chapterId: session.chapterId, // null - 明確な「未所属」状態
    chapter: nullToUndefined(session.chapter) // undefined - オプショナル情報
  }
}

/**
 * Prisma UploadをフロントエンドのUploadTypeに変換
 */
export function transformUpload(upload: Upload): UploadWithUndefined {
  return {
    ...upload,
    clientId: nullToUndefined(upload.clientId)
  }
}

/**
 * フロントエンド用のUpload型（null → undefined）
 */
export interface UploadWithUndefined {
  id: string
  clientId?: string
  comment: string
  createdAt: Date
  gameId: string
}

/**
 * 配列のnullをundefinedに変換
 */
export function transformGames(games: Game[]): GameType[] {
  return games.map(transformGame)
}

/**
 * 配列のnullをundefinedに変換
 */
export function transformPlaySessions(
  sessions: (PlaySession & { chapter?: { id: string; name: string; order: number } | null })[]
): PlaySessionType[] {
  return sessions.map(transformPlaySession)
}

/**
 * 配列のnullをundefinedに変換
 */
export function transformUploads(uploads: Upload[]): UploadWithUndefined[] {
  return uploads.map(transformUpload)
}
