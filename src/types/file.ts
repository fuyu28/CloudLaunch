export enum PathType {
  Directory = "Directory",
  Executable = "Executable",
  File = "File",
  NotFound = "NotFound",
  NoPermission = "NoPermission",
  UnknownError = "UnknownError"
}

export type ValidatePathResult = {
  ok: boolean // ファイル形式が正しいかどうか
  type?: string // 読み取ったファイル形式
  errorType?: PathType // ok=false のときにエラー種別
}
