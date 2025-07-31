// テスト環境でloggerが利用できない場合のフォールバック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let logger: any
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  logger = require("@renderer/utils/logger").logger
} catch {
  // テスト環境でloggerが使用できない場合のモック
  logger = {
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {}
  }
}

/**
 * @fileoverview ファイルパス検証ユーティリティ
 *
 * このファイルは、フォームで入力されたファイルパスの検証機能を提供します。
 *
 * 主な機能：
 * - ローカルファイルパスの存在チェック
 * - URLの有効性チェック
 * - ファイル拡張子の検証
 *
 * 使用例：
 * ```typescript
 * const isValid = await validateFilePath('/path/to/file.exe')
 * const isValidImage = await validateImagePath('https://example.com/image.jpg')
 * ```
 */

/**
 * URLかどうかを判定する関数
 * @param path 検証対象のパス
 * @returns URLの場合true、ローカルパスの場合false
 */
export function isUrl(path: string): boolean {
  // まず基本的なURL形式をチェック
  if (!path.includes("://")) {
    return false
  }

  // HTTP/HTTPSプロトコルをチェック
  if (path.toLowerCase().startsWith("http://") || path.toLowerCase().startsWith("https://")) {
    try {
      new URL(path)
      return true
    } catch {
      return false
    }
  }

  // Windows形式のファイルパス（D:\...）はURLではない
  if (/^[A-Za-z]:[\\/]/.test(path)) {
    return false
  }

  // その他のプロトコル（ftp、fileなど）もチェック
  try {
    const url = new URL(path)
    return url.protocol !== "file:" // file:プロトコルはローカルファイルとして扱う
  } catch {
    return false
  }
}

/**
 * ファイルパスの存在チェック（ローカルファイルのみ）
 * @param filePath 検証対象のファイルパス
 * @returns ファイルが存在する場合true
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  if (!filePath || filePath.trim() === "") {
    return false
  }

  // URLの場合は存在チェックをスキップ
  if (isUrl(filePath)) {
    return true
  }

  try {
    // ElectronのAPIを使ってファイル存在チェック
    const exists = await window.api.file.checkFileExists(filePath)
    return exists
  } catch (error) {
    logger.error("ファイル存在チェックエラー:", {
      component: "fileValidation",
      function: "unknown",
      data: error
    })
    return false
  }
}

/**
 * ディレクトリパスの存在チェック
 * @param dirPath 検証対象のディレクトリパス
 * @returns ディレクトリが存在する場合true
 */
export async function checkDirectoryExists(dirPath: string): Promise<boolean> {
  if (!dirPath || dirPath.trim() === "") {
    return false
  }

  try {
    // ElectronのAPIを使ってディレクトリ存在チェック
    const exists = await window.api.file.checkDirectoryExists(dirPath)
    return exists
  } catch (error) {
    logger.warn("ディレクトリ存在チェックエラー:", {
      component: "fileValidation",
      function: "unknown",
      data: error
    })
    return false
  }
}

/**
 * 画像パスの検証（URLまたはローカルファイル）
 * @param imagePath 検証対象の画像パス
 * @returns 有効な画像パスの場合true
 */
export async function validateImagePath(imagePath: string): Promise<boolean> {
  if (!imagePath || imagePath.trim() === "") {
    return true // 画像パスは任意項目
  }

  // URLの場合は拡張子チェックのみ
  if (isUrl(imagePath)) {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
    const url = new URL(imagePath)
    const pathname = url.pathname.toLowerCase()
    return imageExtensions.some((ext) => pathname.endsWith(ext))
  }

  // ローカルファイルの場合は存在チェック
  return await checkFileExists(imagePath)
}

/**
 * 実行ファイルパスの検証
 * @param exePath 検証対象の実行ファイルパス
 * @returns 有効な実行ファイルパスの場合true
 */
export async function validateExecutablePath(exePath: string): Promise<boolean> {
  if (!exePath || exePath.trim() === "") {
    return false // 実行ファイルパスは必須
  }

  // URLは実行ファイルとして無効
  if (isUrl(exePath)) {
    return false
  }

  // 拡張子チェック
  const executableExtensions = [".exe", ".app"]
  const hasValidExtension = executableExtensions.some((ext) => exePath.toLowerCase().endsWith(ext))

  if (!hasValidExtension) {
    return false
  }

  // ファイル存在チェック
  return await checkFileExists(exePath)
}

/**
 * セーブフォルダパスの検証
 * @param saveFolderPath 検証対象のセーブフォルダパス
 * @returns 有効なセーブフォルダパスの場合true
 */
export async function validateSaveFolderPath(saveFolderPath: string): Promise<boolean> {
  if (!saveFolderPath || saveFolderPath.trim() === "") {
    return true // セーブフォルダパスは任意項目
  }

  // URLはフォルダパスとして無効
  if (isUrl(saveFolderPath)) {
    return false
  }

  // ディレクトリ存在チェック
  return await checkDirectoryExists(saveFolderPath)
}
