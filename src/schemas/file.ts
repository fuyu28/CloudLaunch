import { z } from "zod"

/**
 * ファイルパス検証用の基本スキーマ
 * パストラバーサル攻撃対策を含む
 */
const baseFilePathSchema = z
  .string()
  .min(1, "ファイルパスは必須です")
  .refine(
    (path) => {
      // パストラバーサル攻撃対策: ../ や ..\\ を含むパスを拒否
      const normalizedPath = path.replace(/\\/g, "/")
      return !normalizedPath.includes("../") && !normalizedPath.includes("..\\")
    },
    {
      message: "無効なファイルパスです（パストラバーサル攻撃の可能性）"
    }
  )

/**
 * アップロード用ファイルパス検証スキーマ
 * セーブデータアップロード時のローカルパス検証
 */
export const uploadFilePathSchema = z.object({
  localPath: baseFilePathSchema,
  gameId: z.uuid("有効なゲームIDを指定してください"),
  comment: z.string().max(500, "コメントは500文字以内で入力してください").optional()
})

/**
 * ダウンロード用ファイルパス検証スキーマ
 * セーブデータダウンロード時のリモートパス検証
 */
export const downloadFilePathSchema = z.object({
  remotePath: z.string().min(1, "リモートパスは必須です"),
  localPath: baseFilePathSchema,
  gameId: z.uuid("有効なゲームIDを指定してください")
})

/**
 * ファイル選択ダイアログ用スキーマ
 * ファイル・フォルダ選択時のフィルター設定
 */
export const fileSelectionSchema = z.object({
  title: z.string().max(100, "タイトルは100文字以内で入力してください").optional(),
  defaultPath: z.string().optional(),
  filters: z
    .array(
      z.object({
        name: z.string().min(1, "フィルター名は必須です"),
        extensions: z.array(z.string().min(1, "拡張子は必須です"))
      })
    )
    .optional(),
  properties: z
    .array(
      z.enum([
        "openFile",
        "openDirectory",
        "multiSelections",
        "showHiddenFiles",
        "createDirectory",
        "promptToCreate",
        "noResolveAliases",
        "treatPackageAsDirectory"
      ])
    )
    .optional()
})

/**
 * ファイル存在チェック用スキーマ
 * ファイル・ディレクトリの存在確認
 */
export const fileExistenceSchema = z.object({
  path: baseFilePathSchema,
  type: z.enum(["file", "directory"]),
  checkAccess: z.boolean().default(false)
})

/**
 * アップロードファイルパスデータの型定義（zodスキーマから自動生成）
 */
export type UploadFilePathData = z.infer<typeof uploadFilePathSchema>

/**
 * ダウンロードファイルパスデータの型定義（zodスキーマから自動生成）
 */
export type DownloadFilePathData = z.infer<typeof downloadFilePathSchema>

/**
 * ファイル選択データの型定義（zodスキーマから自動生成）
 */
export type FileSelectionData = z.infer<typeof fileSelectionSchema>

/**
 * ファイル存在チェックデータの型定義（zodスキーマから自動生成）
 */
export type FileExistenceData = z.infer<typeof fileExistenceSchema>
