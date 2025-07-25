/**
 * @fileoverview 設定値定数定義
 *
 * このファイルは、アプリケーション全体で使用される設定値を定数として定義します。
 * 主な機能：
 * - 設定値の一元管理
 * - マジック数値の削除
 * - 設定変更の容易さ
 * - 設定値の意図の明確化
 */

/**
 * アプリケーション全体で使用される設定値定数
 */
export const CONFIG = {
  // タイミング関連（ミリ秒）
  TIMING: {
    /** 検索のデバウンス時間 */
    SEARCH_DEBOUNCE_MS: 300
  },

  // バリデーション関連
  VALIDATION: {
    /** アクセスキーIDの最小文字数 */
    ACCESS_KEY_MIN_LENGTH: 10,
    /** シークレットアクセスキーの最小文字数 */
    SECRET_KEY_MIN_LENGTH: 20,
    /** ゲームタイトルの最大文字数 */
    TITLE_MAX_LENGTH: 100,
    /** パブリッシャー名の最大文字数 */
    PUBLISHER_MAX_LENGTH: 100
  },

  // デフォルト値
  DEFAULTS: {
    /** デフォルトリージョン */
    REGION: "auto",
    /** デフォルトプレイステータス */
    PLAY_STATUS: "unplayed" as const
  },

  // UI関連
  UI: {
    /** ゲームカードの幅 */
    CARD_WIDTH: "220px",
    /** フローティングボタンの位置 */
    FLOATING_BUTTON_POSITION: "bottom-16 right-6",
    /** アイコンサイズ */
    ICON_SIZE: 28
  },

  // ファイル関連
  FILE: {
    /** 画像ファイルの拡張子リスト */
    IMAGE_EXTENSIONS: ["png", "jpg", "jpeg", "gif"] as const,
    /** 実行ファイルの拡張子リスト */
    EXECUTABLE_EXTENSIONS: ["exe", "app"] as const
  },

  // ファイルサイズ関連
  FILE_SIZE: {
    /** 最大アップロードサイズ (MB) */
    MAX_UPLOAD_SIZE_MB: 100,
    /** 最大画像サイズ (MB) */
    MAX_IMAGE_SIZE_MB: 10
  },

  // AWS S3/R2関連
  AWS: {
    /** デフォルトリージョン */
    DEFAULT_REGION: "auto",
    /** 削除バッチのサイズ（S3の制限による）*/
    DELETE_BATCH_SIZE: 1000,
    /** リクエストタイムアウト (ms) */
    REQUEST_TIMEOUT_MS: 30000,
    /** オブジェクト一覧取得の最大反復回数（無限ループ防止） */
    MAX_LIST_ITERATIONS: 1000
  },

  // Steam関連
  STEAM: {
    /** Steamアプリ起動フラグ */
    APPLAUNCH_FLAG: "-applaunch",
    /** VR無効化フラグ */
    NO_VR_FLAG: "--no-vr"
  },

  // Prisma関連
  PRISMA: {
    /** 重複エラーコード */
    UNIQUE_CONSTRAINT_ERROR: "P2002"
  },

  // パス関連
  PATH: {
    /** リモートパスのテンプレート */
    REMOTE_PATH_TEMPLATE: (title: string) => `games/${title}/save_data`
  }
} as const

/**
 * 設定値定数の型定義
 */
export type Config = typeof CONFIG
