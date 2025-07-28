import { promises as fs } from "fs"

import { fileTypeFromFile } from "file-type"

import { logger } from "./logger"
import type { ValidatePathResult } from "../../types/file"
import { PathType } from "../../types/file"
import type { FileTypeResult } from "file-type"

const EXE_HEADER = Buffer.from([0x4d, 0x5a]) // "MZ"

/**
 * ファイル・ディレクトリの存在確認と形式検証を行う
 *
 * この関数は、指定されたパスが存在するかどうかを確認し、
 * オプションで期待する形式（ファイル種別）と一致するかを検証します。
 *
 * 検証プロセス：
 * 1. パスの存在確認（fs.stat）
 * 2. ディレクトリ vs ファイルの判定
 * 3. ファイルの場合：マジックナンバー解析による形式特定
 *    - file-typeライブラリによる自動判定
 *    - .exeファイル用のカスタム判定（MZヘッダーチェック）
 *    - フォールバック：拡張子ベースの判定
 * 4. 期待形式との照合
 *
 * @param filePath 検証するパス（絶対パス推奨）
 * @param expectType 期待するファイル形式（PathType列挙値または文字列）
 *                   - PathType.Directory: ディレクトリ
 *                   - PathType.Executable: 実行ファイル(.exe)
 *                   - "png", "jpg", "jpeg": 画像ファイル
 *                   - 省略時: 存在確認のみ
 * @returns ValidatePathResult
 *          - ok: true = 検証成功
 *          - ok: false = 検証失敗（errorType に失敗理由）
 *          - type: 検出されたファイル形式
 */
export async function validatePathWithType(
  filePath: string,
  expectType?: PathType | string
): Promise<ValidatePathResult> {
  try {
    const stat = await fs.stat(filePath)
    logger.debug(`Path stat for ${filePath}:`, stat)

    // ディレクトリ
    if (stat.isDirectory()) {
      if (expectType && expectType !== PathType.Directory) {
        logger.debug(`Path ${filePath} is directory, but expected ${expectType}`)
        return { ok: false, errorType: PathType.Directory }
      }
      logger.debug(`Path ${filePath} is a valid directory.`)
      return { ok: true, type: PathType.Directory }
    }

    // ファイル
    // 1) マジックナンバー解析
    let actualExt: string
    const fileType: FileTypeResult | undefined = await fileTypeFromFile(filePath)
    if (fileType) {
      actualExt = fileType.ext // png, jpg, exe など
      logger.debug(`File type detected by file-type: ${actualExt}`)
    } else {
      // 2) マジックナンバー解析で出なかったら先頭2バイトで.exe判定
      const handle = await fs.open(filePath, "r")
      const header = Buffer.alloc(2)
      await handle.read(header, 0, 2, 0)
      await handle.close()

      if (header.equals(EXE_HEADER)) {
        actualExt = "exe"
        logger.debug(`File type detected by EXE_HEADER: ${actualExt}`)
      } else {
        // 最後の手段で拡張子を落とす
        actualExt = filePath.split(".").pop()?.toLowerCase() ?? ""
        logger.debug(`File type detected by extension: ${actualExt}`)
      }
    }

    // 実行可能ファイルを期待していたら、actualExt==="exe" だけでなく
    // PathType.Executable ともマッチさせる
    const expectsExe = expectType === PathType.Executable || expectType === "exe"
    if (expectsExe && actualExt === "exe") {
      // OK
      logger.debug(`Path ${filePath} is a valid executable.`)
      return { ok: true, type: PathType.Executable }
    }

    // png/jpeg期待チェックなど、他の形式チェック
    if (expectType && !expectsExe && expectType !== actualExt) {
      logger.debug(`Path ${filePath} is ${actualExt}, but expected ${expectType}`)
      return { ok: false, type: actualExt, errorType: PathType.File }
    }

    // expectType がない＝存在チェックのみ
    if (!expectType) {
      logger.debug(`Path ${filePath} exists and type is ${actualExt}.`)
      return { ok: true, type: actualExt }
    }

    // expectType が actualExt と一致（exe以外のケース）
    logger.debug(`Path ${filePath} exists and type ${actualExt} matches expected ${expectType}.`)
    return { ok: true, type: actualExt }
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    logger.error(`Error validating path ${filePath}:`, error)
    switch (err.code) {
      case "ENOENT":
        return { ok: false, errorType: PathType.NotFound }
      case "EACCES":
      case "EPERM":
        return { ok: false, errorType: PathType.NoPermission }
      default:
        return { ok: false, errorType: PathType.UnknownError }
    }
  }
}
