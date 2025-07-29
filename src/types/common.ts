/**
 * @fileoverview 共通型定義のエクスポート
 *
 * このファイルは、types ディレクトリ内の共通的に使用される型をまとめてエクスポートします。
 * 主な機能：
 * - 共通型の一括エクスポート
 * - インポートパスの簡略化
 * - 型の統一的なアクセス
 */

// バリデーション関連の型
export * from "./validation"

// パス関連の型
export * from "./path"

// 既存の型も再エクスポート
export * from "./result"
export * from "./error"

/**
 * 汎用的なオプション型
 */
export type SelectOption<T = string> = {
  /** 表示ラベル */
  label: string
  /** 値 */
  value: T
  /** 無効化されているかどうか */
  disabled?: boolean
}

/**
 * ページネーション情報
 */
export type PaginationInfo = {
  /** 現在のページ */
  currentPage: number
  /** 総ページ数 */
  totalPages: number
  /** 1ページあたりのアイテム数 */
  itemsPerPage: number
  /** 総アイテム数 */
  totalItems: number
}

/**
 * ソート情報
 */
export type SortInfo<T extends string = string> = {
  /** ソートフィールド */
  field: T
  /** ソート方向 */
  direction: "asc" | "desc"
}

/**
 * 検索フィルター
 */
export type SearchFilter = {
  /** 検索クエリ */
  query?: string
  /** カテゴリ */
  category?: string
  /** 日付範囲 */
  dateRange?: {
    from?: Date
    to?: Date
  }
}

/**
 * ローディング状態
 */
export type LoadingState = {
  /** ローディング中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error?: string
  /** 最終更新日時 */
  lastUpdated?: Date
}

/**
 * 非同期操作の状態
 */
export type AsyncStatus = "idle" | "loading" | "success" | "error"

/**
 * 非同期操作の状態管理
 */
export type AsyncState<T = unknown> = {
  /** 現在の状態 */
  status: AsyncStatus
  /** データ */
  data?: T
  /** エラー情報 */
  error?: string
}

/**
 * キーと値のペア（汎用）
 */
export type KeyValuePair<K = string, V = unknown> = {
  key: K
  value: V
}

/**
 * 範囲指定
 */
export type Range<T = number> = {
  /** 最小値 */
  min: T
  /** 最大値 */
  max: T
}

/**
 * 座標情報
 */
export type Coordinates = {
  /** X座標 */
  x: number
  /** Y座標 */
  y: number
}

/**
 * サイズ情報
 */
export type Size = {
  /** 幅 */
  width: number
  /** 高さ */
  height: number
}
