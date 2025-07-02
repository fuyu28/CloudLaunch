export type ValidatePathResult = {
  ok: boolean // ファイル形式が正しいかどうか
  type?: string // 読み取ったファイル形式
  errorType?: PathType // ok=false のときにエラー種別
}
