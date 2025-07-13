/**
 * @fileoverview メモ管理機能の型定義
 *
 * メモに関連するすべての型定義を集約し、フロントエンドとバックエンド間で
 * 一貫した型安全性を提供します。
 */

/**
 * メモのデータ型
 */
export interface MemoType {
  /** メモID */
  id: string
  /** メモタイトル */
  title: string
  /** メモ内容（Markdown形式） */
  content: string
  /** 関連するゲームID */
  gameId: string
  /** 関連するゲームタイトル（結合クエリ用、オプション） */
  gameTitle?: string
  /** 作成日時 */
  createdAt: Date
  /** 更新日時 */
  updatedAt: Date
}

/**
 * メモ作成時のデータ型
 */
export interface CreateMemoData {
  /** メモタイトル */
  title: string
  /** メモ内容（Markdown形式） */
  content: string
  /** 関連するゲームID */
  gameId: string
}

/**
 * メモ更新時のデータ型
 */
export interface UpdateMemoData {
  /** 更新するメモタイトル */
  title: string
  /** 更新するメモ内容（Markdown形式） */
  content: string
}

/**
 * メモファイル操作の結果型
 */
export interface MemoFileOperationResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** 操作対象のファイルパス */
  filePath?: string
  /** エラーメッセージ（失敗時） */
  error?: string
}

/**
 * メモディレクトリ情報型
 */
export interface MemoDirectoryInfo {
  /** ベースディレクトリパス */
  baseDir: string
  /** ゲーム別ディレクトリパス */
  gameDir: string
  /** メモファイル数 */
  fileCount: number
}

/**
 * クラウドメモ情報型
 */
export interface CloudMemoInfo {
  /** S3キー */
  key: string
  /** ファイル名 */
  fileName: string
  /** ゲームタイトル */
  gameTitle: string
  /** メモタイトル（ファイル名から抽出） */
  memoTitle: string
  /** メモID（ファイル名から抽出） */
  memoId: string
  /** 最終更新日時 */
  lastModified: Date
  /** ファイルサイズ */
  size: number
}

/**
 * メモ同期結果型
 */
export interface MemoSyncResult {
  /** 同期が成功したかどうか */
  success: boolean
  /** アップロードされたメモ数 */
  uploaded: number
  /** ローカルで上書きされたメモ数（クラウド→ローカル） */
  localOverwritten: number
  /** クラウドで上書きされたメモ数（ローカル→クラウド） */
  cloudOverwritten: number
  /** 作成されたメモ数（ダウンロード） */
  created: number
  /** 更新されたメモ数（ダウンロード） */
  updated: number
  /** スキップされたメモ数 */
  skipped: number
  /** エラーメッセージ（失敗時） */
  error?: string
  /** 詳細メッセージ */
  details: string[]
}
