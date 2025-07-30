/**
 * @fileoverview サービス層エクスポートインデックス
 *
 * このファイルは、サービス層の全ての機能を統一的にエクスポートし、
 * 依存関係を明確に管理するためのエントリーポイントです。
 *
 * アーキテクチャルール：
 * - サービス同士の循環依存を防ぐ
 * - 外部からのインポートを集約管理
 * - 機能別に分離されたサービスの統合
 */

// 基本エンティティサービス
export * as gameService from "./gameService"
export * as memoService from "./memoService"
export * as credentialService from "./credentialService"
export * as chapterService from "./chapterService"

// クラウド関連サービス
export * as cloudStorageService from "./cloudStorageService"
export * as cloudMemoService from "./cloudMemoService"
export * as memoSyncService from "./memoSyncService"
export * as downloadService from "./downloadService"
export * as uploadService from "./uploadService"

// システムサービス
export * as processMonitorService from "./processMonitorService"

// 型定義の再エクスポート
export type { S3ObjectMetadata, CloudStorageError } from "./cloudStorageService"
export type { CloudDataInfo, CloudFileDetail, CloudFileDetails } from "./downloadService"

/**
 * サービス層の依存関係図
 *
 * 基本サービス層:
 * - gameService: ゲーム管理（CRUD、プレイセッション）
 * - memoService: メモ管理（CRUD、ファイル操作）
 * - credentialService: 認証情報管理
 * - chapterService: 章管理（CRUD、統計）
 *
 * クラウドサービス層:
 * - cloudStorageService: 低レベルS3操作
 * - cloudMemoService: メモのクラウド同期
 * - memoSyncService: メモ同期ロジック
 * - downloadService: セーブデータダウンロード
 * - uploadService: セーブデータアップロード
 *
 * システムサービス層:
 * - processMonitorService: プロセス監視
 *
 * 依存関係:
 * - memoService → memoFileManager
 * - cloudMemoService → cloudStorageService
 * - memoSyncService → cloudStorageService + memoService
 * - gameService → chapterHandlers (一時的)
 */
