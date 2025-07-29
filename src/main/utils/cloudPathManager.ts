/**
 * @fileoverview クラウドパス管理ユーティリティ
 *
 * クラウドストレージ上のパス構造を統一管理します。
 * セーブデータとメモの両方で一貫したパス構造を提供し、
 * パス生成ロジックの重複を防ぎます。
 *
 * パス構造:
 * - セーブデータ: games/[gameTitle]/savedata/[fileName]
 * - メモ: games/[gameTitle]/memo/[memoTitle]_[memoId].md
 */

/**
 * ファイル名・フォルダ名をクラウドストレージ用にサニタイズ
 *
 * @param name サニタイズする名前
 * @returns サニタイズされた名前
 */
function sanitizeForCloudPath(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "_") // 無効な文字を_に置換
    .replace(/\s+/g, "_") // スペースを_に置換
    .replace(/_{2,}/g, "_") // 連続する_を単一に
    .replace(/^_|_$/g, "") // 先頭・末尾の_を削除
    .slice(0, 100) // 長さ制限
}

/**
 * クラウドパス管理クラス
 */
export class CloudPathManager {
  /**
   * セーブデータのクラウドパスを生成
   *
   * @param gameTitle ゲームタイトル
   * @param fileName ファイル名
   * @returns クラウドパス
   */
  static buildSaveDataPath(gameTitle: string, fileName: string): string {
    const sanitizedGameTitle = sanitizeForCloudPath(gameTitle)
    return `games/${sanitizedGameTitle}/savedata/${fileName}`
  }

  /**
   * セーブデータフォルダのプレフィックスを生成
   *
   * @param gameTitle ゲームタイトル
   * @returns プレフィックス
   */
  static buildSaveDataPrefix(gameTitle: string): string {
    const sanitizedGameTitle = sanitizeForCloudPath(gameTitle)
    return `games/${sanitizedGameTitle}/savedata/`
  }

  /**
   * メモのクラウドパスを生成
   *
   * @param gameTitle ゲームタイトル
   * @param memoTitle メモタイトル
   * @param memoId メモID
   * @returns クラウドパス
   */
  static buildMemoPath(gameTitle: string, memoTitle: string, memoId: string): string {
    const sanitizedGameTitle = sanitizeForCloudPath(gameTitle)
    const sanitizedMemoTitle = sanitizeForCloudPath(memoTitle)
    return `games/${sanitizedGameTitle}/memo/${sanitizedMemoTitle}_${memoId}.md`
  }

  /**
   * メモフォルダのプレフィックスを生成
   *
   * @param gameTitle ゲームタイトル（オプション）
   * @returns プレフィックス
   */
  static buildMemoPrefix(gameTitle?: string): string {
    if (gameTitle) {
      const sanitizedGameTitle = sanitizeForCloudPath(gameTitle)
      return `games/${sanitizedGameTitle}/memo/`
    }
    return "games/"
  }

  /**
   * ゲーム全体のプレフィックスを生成
   *
   * @param gameTitle ゲームタイトル
   * @returns プレフィックス
   */
  static buildGamePrefix(gameTitle: string): string {
    const sanitizedGameTitle = sanitizeForCloudPath(gameTitle)
    return `games/${sanitizedGameTitle}/`
  }

  /**
   * パスからゲームタイトルを抽出
   *
   * @param cloudPath クラウドパス
   * @returns ゲームタイトル（抽出できない場合はnull）
   */
  static extractGameTitle(cloudPath: string): string | null {
    const match = cloudPath.match(/^games\/([^/]+)\//)
    return match ? match[1] : null
  }

  /**
   * パスがメモパスかどうかを判定
   *
   * @param cloudPath クラウドパス
   * @returns メモパスの場合true
   */
  static isMemoPath(cloudPath: string): boolean {
    return cloudPath.includes("/memo/") && cloudPath.endsWith(".md")
  }

  /**
   * パスがセーブデータパスかどうかを判定
   *
   * @param cloudPath クラウドパス
   * @returns セーブデータパスの場合true
   */
  static isSaveDataPath(cloudPath: string): boolean {
    return cloudPath.includes("/savedata/")
  }

  /**
   * メモパスからメモ情報を抽出
   *
   * @param memoPath メモのクラウドパス
   * @returns メモ情報（抽出できない場合はnull）
   */
  static extractMemoInfo(
    memoPath: string
  ): { gameTitle: string; memoTitle: string; memoId: string } | null {
    const match = memoPath.match(/^games\/([^/]+)\/memo\/(.+)_([^_]+)\.md$/)
    if (!match) return null

    return {
      gameTitle: match[1],
      memoTitle: match[2],
      memoId: match[3]
    }
  }
}
