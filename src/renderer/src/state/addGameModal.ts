import { atom } from "jotai"
import { InputGameData } from "src/types/game"

// AddGameModal.tsx

// 入力するゲームの情報
export const gameFormValuesAtom = atom<InputGameData>({
  title: "",
  publisher: "",
  saveFolderPath: "",
  exePath: "",
  imagePath: "",
  playStatus: "unplayed"
})

// AddGameModalのエラーメッセージ
export const addGameModalErrorAtom = atom<string | null>(null)

// 登録中のフラグ
export const submittingAtom = atom(false)

// ちゃんとフォームが埋められているかのフラグ
export const canSubmitAtom = atom(false)
