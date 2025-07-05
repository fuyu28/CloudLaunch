/**
 * @fileoverview メッセージ定数定義
 *
 * このファイルは、アプリケーション全体で使用されるメッセージ文字列を定数として定義します。
 * 主な機能：
 * - UIメッセージの一元管理
 * - 多言語対応への準備
 * - メッセージの重複防止
 * - 保守性の向上
 */

/**
 * アプリケーション全体で使用されるメッセージ定数
 */
export const MESSAGES = {
  // ゲーム操作関連
  GAME: {
    ADDING: "ゲームを追加しています...",
    ADDED: "ゲームを追加しました",
    ADD_FAILED: "ゲームの追加に失敗しました",
    LAUNCHING: "ゲームを起動しています...",
    LAUNCHED: "ゲームが起動しました",
    LAUNCH_FAILED: "ゲームの起動に失敗しました",
    LIST_FETCH_FAILED: "ゲーム一覧の取得に失敗しました",
    CREATE_FAILED: "ゲームの作成に失敗しました。",
    UPDATE_FAILED: "ゲームの更新に失敗しました。",
    DELETE_FAILED: "ゲームの削除に失敗しました。",
    ALREADY_EXISTS: (title: string) => `ゲーム「${title}」は既に存在します。`,
    PLAY_TIME_RECORD_FAILED: "プレイ時間の記録に失敗しました。"
  },

  // セーブデータ関連
  SAVE_DATA: {
    FOLDER_NOT_SET: "セーブデータフォルダが設定されていません。",
    UPLOADING: "セーブデータをアップロード中…",
    UPLOADED: "セーブデータのアップロードに成功しました。",
    DOWNLOADING: "セーブデータをダウンロード中…",
    DOWNLOADED: "セーブデータのダウンロードに成功しました。"
  },

  // 接続・認証関連
  CONNECTION: {
    CHECKING: "接続確認中...",
    OK: "接続OK",
    INVALID_CREDENTIALS: "クレデンシャルが有効ではありません"
  },

  // ファイル操作関連
  FILE: {
    SELECT_ERROR: "ファイル選択中にエラーが発生しました",
    FOLDER_SELECT_ERROR: "フォルダ選択中にエラーが発生しました",
    NOT_FOUND: "ファイルが見つかりません。パスを確認してください。",
    ACCESS_DENIED: "ファイルへのアクセス権がありません。権限設定を確認してください。"
  },

  // Steam関連
  STEAM: {
    EXE_NOT_FOUND: "Steam 実行ファイルが見つかりません",
    ACCESS_DENIED: "Steam へのアクセス権がありません"
  },

  // AWS/R2エラー関連
  AWS: {
    BUCKET_NOT_EXISTS: "バケットが存在しません。",
    INVALID_REGION: "リージョン名が正しくありません。",
    INVALID_ACCESS_KEY: "アクセスキーIDが正しくありません。",
    INVALID_CREDENTIALS: "認証情報が正しくありません。",
    NETWORK_ERROR: "ネットワークエラーです。エンドポイントとネットワークの接続を確認してください。"
  },

  // 一般的なエラー
  ERROR: {
    UNEXPECTED: "予期しないエラーが発生しました",
    GENERAL: "エラーが発生しました"
  },

  // UI関連
  UI: {
    BROWSE: "参照",
    CANCEL: "キャンセル",
    SAVE: "保存",
    DELETE: "削除",
    CLOSE: "閉じる"
  }
} as const

/**
 * メッセージ定数の型定義
 */
export type Messages = typeof MESSAGES
