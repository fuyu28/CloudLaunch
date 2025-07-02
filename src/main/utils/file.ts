import { promises as fs } from "fs"
import { fileTypeFromFile, FileTypeResult } from "file-type"
import { PathType } from "../ipcHandlers/launchGameHandlers"
import type { ValidatePathResult } from "../../types/file"

const EXE_HEADER = Buffer.from([0x4d, 0x5a]) // "MZ"

/**
 * パスが存在し、かつ(expectType指定時は)期待フォーマットと合致するかを検証する。
 * @param targetPath 検証するパス
 * @param expectType PNG/JPEG/.exe/"Directory"/"File" など（省略可）
 * @returns ValidatePathResult
 */
export async function validatePathWithType(
  targetPath: string,
  expectType?: PathType | string
): Promise<ValidatePathResult> {
  try {
    const stat = await fs.stat(targetPath)

    // ディレクトリ
    if (stat.isDirectory()) {
      if (expectType && expectType !== PathType.Directory) {
        return { ok: false, errorType: PathType.Directory }
      }
      return { ok: true, type: PathType.Directory }
    }

    // ファイル
    // 1) マジックナンバー解析
    let actualExt: string
    const fileType: FileTypeResult | undefined = await fileTypeFromFile(targetPath)
    if (fileType) {
      actualExt = fileType.ext // png, jpg, exe など
    } else {
      // 2) マジックナンバー解析で出なかったら先頭2バイトで.exe判定
      const handle = await fs.open(targetPath, "r")
      const header = Buffer.alloc(2)
      await handle.read(header, 0, 2, 0)
      await handle.close()

      if (header.equals(EXE_HEADER)) {
        actualExt = "exe"
      } else {
        // 最後の手段で拡張子を落とす
        actualExt = targetPath.split(".").pop()?.toLowerCase() ?? ""
      }
    }

    // 実行可能ファイルを期待していたら、actualExt==="exe" だけでなく
    // PathType.Executable ともマッチさせる
    const expectsExe = expectType === PathType.Executable || expectType === "exe"
    if (expectsExe && actualExt === "exe") {
      // OK
      return { ok: true, type: PathType.Executable }
    }

    // png/jpeg期待チェックなど、他の形式チェック
    if (expectType && !expectsExe && expectType !== actualExt) {
      return { ok: false, type: actualExt, errorType: PathType.File }
    }

    // expectType がない＝存在チェックのみ
    if (!expectType) {
      return { ok: true, type: actualExt }
    }

    // expectType が actualExt と一致（exe以外のケース）
    return { ok: true, type: actualExt }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
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
