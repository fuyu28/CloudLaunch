/**
 * @fileoverview 処理関連の定数定義
 *
 * このファイルは、各種処理で使用される定数値を一元管理します。
 * マジックナンバーの削減と、設定変更時の影響範囲の明確化を目的とします。
 */

/**
 * バッチ処理のサイズ設定
 */
export const BATCH_SIZES = {
  /** アップロード・ダウンロード処理のバッチサイズ（ネットワーク負荷を考慮） */
  UPLOAD_DOWNLOAD: 5,
  /** ファイル詳細取得処理のバッチサイズ */
  FILE_DETAILS: 10,
  /** メモ同期処理のバッチサイズ */
  MEMO_SYNC: 5
} as const

/**
 * パス検証の設定
 */
export const PATH_SECURITY = {
  /** 最大許可オブジェクトキー長（S3の制限に準拠） */
  MAX_OBJECT_KEY_LENGTH: 1024
} as const
