/**
 * @fileoverview 統一ログ機能
 *
 * このファイルは、アプリケーション全体で使用される統一ログ機能を提供します。
 * 主な機能：
 * - レベル別ログ出力（debug, info, warn, error）
 * - 本番環境でのデバッグログ抑制
 * - エラーオブジェクトの詳細表示
 * - ログフォーマットの統一
 */

/**
 * 統一ログ機能
 */
class Logger {
  private readonly isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
  }

  /**
   * デバッグログ（開発環境のみ）
   * @param message メッセージ
   * @param data 追加データ
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data ?? "")
    }
  }

  /**
   * 情報ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  info(message: string, data?: unknown): void {
    console.log(`[INFO] ${message}`, data ?? "")
  }

  /**
   * 警告ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data ?? "")
  }

  /**
   * エラーログ
   * @param message メッセージ
   * @param error エラーオブジェクト
   * @param data 追加データ
   */
  error(message: string, error?: unknown, data?: unknown): void {
    console.error(`[ERROR] ${message}`, error ?? "", data ?? "")
  }
}

export const logger = new Logger()
