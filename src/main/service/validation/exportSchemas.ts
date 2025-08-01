/**
 * @fileoverview エクスポートデータのバリデーション用Zodスキーマ
 *
 * データベースから直接取得したデータ（Date型など）の検証用スキーマを定義
 * importSchemasとは異なり、データベースのネイティブ型に対応
 */

import { z } from "zod"

/**
 * エクスポート用ゲームレコードスキーマ
 * データベースから取得したDate型オブジェクトを想定
 */
export const ExportGameRecordSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  publisher: z.string().nullable(),
  imagePath: z.string().nullable(),
  exePath: z.string(),
  saveFolderPath: z.string().nullable(),
  createdAt: z.date(), // Date型として定義
  playStatus: z.enum(["unplayed", "playing", "played"]),
  totalPlayTime: z.number().min(0),
  lastPlayed: z.date().nullable(), // Date型として定義
  clearedAt: z.date().nullable(), // Date型として定義
  currentChapter: z.string().nullable()
})

/**
 * エクスポート用プレイセッションレコードスキーマ
 */
export const ExportPlaySessionRecordSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  playedAt: z.date(), // Date型として定義
  duration: z.number().min(0),
  sessionName: z.string().nullable(),
  chapterId: z.uuid().nullable(),
  uploadId: z.uuid().nullable()
})

/**
 * エクスポート用アップロードレコードスキーマ
 */
export const ExportUploadRecordSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  clientId: z.string().nullable(),
  comment: z.string(),
  createdAt: z.date() // Date型として定義
})

/**
 * エクスポート用チャプターレコードスキーマ
 */
export const ExportChapterRecordSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  name: z.string(),
  order: z.number().min(0),
  createdAt: z.date() // Date型として定義
})

/**
 * エクスポート用メモレコードスキーマ
 */
export const ExportMemoRecordSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date(), // Date型として定義
  updatedAt: z.date() // Date型として定義
})
