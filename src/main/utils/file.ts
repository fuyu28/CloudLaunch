import { promises as fs } from "fs"
import { fileTypeFromFile, FileTypeResult } from "file-type"
import { PathType, ValidatePathResult } from "../../types/file"

const EXE_HEADER = Buffer.from([0x4d, 0x5a]) // "MZ"

/**
 * パスが存在し、かつ(expectType指定時は)期待フォーマットと合致するかを検証する。
 * @param filePath 検証するパス
 * @param expectType PNG/JPEG/.exe/"Directory"/"File" など（省略可）
 * @returns ValidatePathResult
 */
export async function validatePathWithType(
  filePath: string,
  expectType?: PathType | string
): Promise<ValidatePathResult> {
  try {
    const stat = await fs.stat(filePath)
    console.log(`Path stat for ${filePath}:`, stat)

    // ディレクトリ
    if (stat.isDirectory()) {
      if (expectType && expectType !== PathType.Directory) {
        console.log(`Path ${filePath} is directory, but expected ${expectType}`)
        return { ok: false, errorType: PathType.Directory }
      }
      console.log(`Path ${filePath} is a valid directory.`)
      return { ok: true, type: PathType.Directory }
    }

    // ファイル
    // 1) マジックナンバー解析
    let actualExt: string
    const fileType: FileTypeResult | undefined = await fileTypeFromFile(filePath)
    if (fileType) {
      actualExt = fileType.ext // png, jpg, exe など
      console.log(`File type detected by file-type: ${actualExt}`)
    } else {
      // 2) マジックナンバー解析で出なかったら先頭2バイトで.exe判定
      const handle = await fs.open(filePath, "r")
      const header = Buffer.alloc(2)
      await handle.read(header, 0, 2, 0)
      await handle.close()

      if (header.equals(EXE_HEADER)) {
        actualExt = "exe"
        console.log(`File type detected by EXE_HEADER: ${actualExt}`)
      } else {
        // 最後の手段で拡張子を落とす
        actualExt = filePath.split(".").pop()?.toLowerCase() ?? ""
        console.log(`File type detected by extension: ${actualExt}`)
      }
    }

    // 実行可能ファイルを期待していたら、actualExt==="exe" だけでなく
    // PathType.Executable ともマッチさせる
    const expectsExe = expectType === PathType.Executable || expectType === "exe"
    if (expectsExe && actualExt === "exe") {
      // OK
      console.log(`Path ${filePath} is a valid executable.`)
      return { ok: true, type: PathType.Executable }
    }

    // png/jpeg期待チェックなど、他の形式チェック
    if (expectType && !expectsExe && expectType !== actualExt) {
      console.log(`Path ${filePath} is ${actualExt}, but expected ${expectType}`)
      return { ok: false, type: actualExt, errorType: PathType.File }
    }

    // expectType がない＝存在チェックのみ
    if (!expectType) {
      console.log(`Path ${filePath} exists and type is ${actualExt}.`)
      return { ok: true, type: actualExt }
    }

    // expectType が actualExt と一致（exe以外のケース）
    console.log(`Path ${filePath} exists and type ${actualExt} matches expected ${expectType}.`)
    return { ok: true, type: actualExt }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Error validating path ${filePath}:`, error)
    switch (error.code) {
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
