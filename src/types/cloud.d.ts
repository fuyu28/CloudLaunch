/**
 * @fileoverview クラウドデータ関連型定義
 *
 * このファイルは、クラウドデータ管理で使用される型を統一的に定義します。
 * 主な機能：
 * - クラウドデータアイテムの型定義
 * - クラウドファイル詳細の型定義
 * - クラウドディレクトリツリーの型定義
 */

/**
 * クラウドデータアイテムの型定義
 */
export type CloudDataItem = {
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
export type CloudFileDetail = {
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
 * クラウドディレクトリツリーノードの型定義
 */
export type CloudDirectoryNode = {
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
