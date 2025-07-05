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
    SECRET_KEY_MIN_LENGTH: 20
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
    FLOATING_BUTTON_POSITION: "bottom-6 right-6",
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

  // AWS S3/R2関連
  S3: {
    /** リスト取得時の最大キー数 */
    MAX_KEYS: 1
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
