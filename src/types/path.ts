/**
 * @fileoverview パス関連型定義
 *
 * このファイルは、アプリケーション全体で使用されるパス関連の型を定義します。
 * 主な機能：
 * - パスの種類の定義
 * - パスバリデーション結果の型
 * - プラットフォーム固有のパス型
 */

/**
 * パスの種類を表す列挙型
 */
export enum PathType {
  /** ファイルパス */
  FILE = "file",
  /** ディレクトリパス */
  DIRECTORY = "directory",
  /** どちらでも可 */
  ANY = "any"
}

/**
 * ファイルパスの処理タイプ
 */
export enum FilePathType {
  /** 実行可能ファイル */
  EXECUTABLE = "executable",
  /** 画像ファイル */
  IMAGE = "image",
  /** 設定ファイル */
  CONFIG = "config",
  /** データファイル */
  DATA = "data",
  /** 一般ファイル */
  GENERAL = "general"
}

/**
 * パス検証の結果
 */
export interface PathValidationResult {
  /** 検証が成功したかどうか */
  isValid: boolean
  /** エラーメッセージ（失敗時） */
  message?: string
  /** 正規化されたパス */
  normalizedPath?: string
  /** 検出されたパスの種類 */
  detectedType?: PathType
}

/**
 * ファイル情報
 */
export interface FileInfo {
  /** ファイルパス */
  path: string
  /** ファイル名（拡張子含む） */
  name: string
  /** ファイル名（拡張子なし） */
  nameWithoutExtension: string
  /** 拡張子（ドット含む） */
  extension: string
  /** 親ディレクトリのパス */
  directory: string
  /** ファイルサイズ（バイト） */
  size?: number
  /** 最終更新日時 */
  lastModified?: Date
}

/**
 * パス操作のオプション
 */
export interface PathOptions {
  /** パスの正規化を行うかどうか */
  normalize?: boolean
  /** 相対パスを許可するかどうか */
  allowRelative?: boolean
  /** プラットフォーム固有の検証を行うかどうか */
  platformSpecific?: boolean
}

/**
 * ファイル選択フィルター
 */
export interface FileFilter {
  /** フィルター名 */
  name: string
  /** 許可する拡張子（ドットなし） */
  extensions: string[]
}

/**
 * S3キー情報
 */
export interface S3KeyInfo {
  /** S3キー */
  key: string
  /** バケット名 */
  bucket?: string
  /** リージョン */
  region?: string
  /** プレフィックス */
  prefix?: string
}

/**
 * リモートパス設定
 */
export interface RemotePathConfig {
  /** ベースパス */
  basePath: string
  /** ゲーム名テンプレート */
  gameNameTemplate?: string
  /** セーブデータフォルダ名 */
  saveDataFolder?: string
  /** 日付フォーマット */
  dateFormat?: string
}
