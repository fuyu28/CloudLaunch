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
    UPDATING: "ゲームを更新しています...",
    UPDATED: "ゲームを更新しました",
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
    UPLOAD_FAILED: "セーブデータのアップロードに失敗しました",
    DOWNLOADING: "セーブデータをダウンロード中…",
    DOWNLOADED: "セーブデータのダウンロードに成功しました。",
    DOWNLOAD_FAILED: "セーブデータのダウンロードに失敗しました"
  },

  // 接続・認証関連
  CONNECTION: {
    CHECKING: "接続確認中...",
    OK: "接続OK",
    INVALID_CREDENTIALS: "クレデンシャルが有効ではありません"
  },

  // 認証関連
  AUTH: {
    CREDENTIAL_NOT_FOUND: "認証情報が見つかりません。設定画面で認証情報を設定してください。",
    CREDENTIAL_INVALID: "認証情報が無効です。設定を確認してください。",
    SAVING: "認証情報を保存しています...",
    SAVED: "認証情報を保存しました",
    SAVE_FAILED: "認証情報の保存に失敗しました"
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
    GENERAL: "エラーが発生しました",
    NETWORK: "ネットワークエラーが発生しました",
    FILE_NOT_FOUND: "ファイルが見つかりません",
    PERMISSION_DENIED: "アクセス権限がありません"
  },

  // UI関連
  UI: {
    BROWSE: "参照",
    CANCEL: "キャンセル",
    SAVE: "保存",
    DELETE: "削除",
    CLOSE: "閉じる"
  },

  // バリデーション関連
  VALIDATION: {
    REQUIRED: (fieldName: string) => `${fieldName}は必須です`,
    MIN_LENGTH: (fieldName: string, minLength: number) =>
      `${fieldName}は${minLength}文字以上で入力してください`,
    MAX_LENGTH: (fieldName: string, maxLength: number) =>
      `${fieldName}は${maxLength}文字以下で入力してください`,
    INVALID_URL: (fieldName: string) => `${fieldName}は有効なURLを入力してください`,
    INVALID_STEAM_URL: "有効なSteam URLを入力してください（例: steam://rungameid/123456）",
    REQUIRED_FIELD_NOT_SET: (fieldName: string) => `${fieldName}が設定されていません`,
    INVALID_URL_FORMAT: "エンドポイントが有効な URL 形式ではありません",
    INVALID_BUCKET_NAME_FORMAT: "バケット名の形式が正しくありません",
    INVALID_ACCESS_KEY_FORMAT: "アクセスキー ID の形式が正しくありません",
    INVALID_SECRET_KEY_FORMAT: "シークレットアクセスキーの形式が正しくありません"
  },

  // IPCエラー関連
  IPC_ERROR: {
    UNKNOWN: "不明なエラーが発生しました",
    CREDENTIAL_PROCESSING_FAILED: "認証情報の処理中にエラーが発生しました",
    CREDENTIAL_PROCESSING_UNKNOWN: "認証情報の処理中に不明なエラーが発生しました",
    FILE_OPERATION_FAILED: "ファイル操作中にエラーが発生しました",
    FILE_OPERATION_UNKNOWN: "ファイル操作中に不明なエラーが発生しました",
    LOCAL_IMAGE_LOAD_FAILED: (message: string) =>
      `ローカル画像の読み込みに失敗しました: ${message}`,
    WEB_IMAGE_LOAD_FAILED: (message: string) => `Web画像の読み込みに失敗しました: ${message}`,
    IMAGE_FETCH_FAILED: (statusText: string) => `画像の取得に失敗しました: ${statusText}`,
    FILE_SELECTION_FAILED: (message: string) => `ファイル選択中にエラーが発生しました: ${message}`,
    FOLDER_SELECTION_FAILED: (message: string) => `フォルダ選択中にエラーが発生しました: ${message}`
  },

  // 認証サービス関連
  CREDENTIAL_SERVICE: {
    SET_FAILED: (error: string) => `認証情報の設定に失敗しました: ${error}`,
    GET_FAILED: "認証情報の取得に失敗しました。",
    KEYCHAIN_NOT_FOUND: "システムキーチェーンが存在しません。OSの設定を確認してください。",
    GET_ERROR: (error: string) => `認証情報の取得エラー: ${error}`,
    VALIDATION_FAILED: (error: string) => `認証情報の検証中にエラーが発生しました: ${error}`,
    VALIDATION_UNKNOWN: "認証情報の検証中に不明なエラーが発生しました"
  },

  // R2クライアント関連
  R2_CLIENT: {
    CREDENTIALS_NOT_SET: "R2/S3 のクレデンシャルが設定されていません"
  }
} as const

/**
 * メッセージ定数の型定義
 */
export type Messages = typeof MESSAGES
