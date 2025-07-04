/**
 * @fileoverview 設定フォーム管理フック
 *
 * このフックは、設定ページのフォーム状態管理と操作を提供します。
 *
 * 主な機能：
 * - フォームデータの状態管理
 * - 初期データの読み込み
 * - バリデーション
 * - 保存処理
 * - 接続テスト
 *
 * 使用例：
 * ```tsx
 * const {
 *   formData,
 *   updateField,
 *   canSubmit,
 *   isSaving,
 *   handleSave,
 *   testConnection
 * } = useSettingsForm()
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import toast from "react-hot-toast"
import { isValidR2OrS3Endpoint } from "@renderer/utils/endpointValidator"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import type { ApiResult } from "../../../types/result"
import type { Creds } from "../../../types/creds"

/**
 * 設定フォームデータの型定義
 */
export interface SettingsFormData {
  bucketName: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

/**
 * 設定フォーム管理フックの戻り値
 */
export interface SettingsFormResult {
  /** フォームデータ */
  formData: SettingsFormData
  /** フィールド更新関数 */
  updateField: (field: keyof SettingsFormData, value: string) => void
  /** 送信可能かどうか */
  canSubmit: boolean
  /** 保存中かどうか */
  isSaving: boolean
  /** 保存処理 */
  handleSave: () => Promise<void>
  /** 接続テスト */
  testConnection: () => Promise<ApiResult<void>>
  /** フィールドエラー */
  fieldErrors: Partial<Record<keyof SettingsFormData, string>>
}

/**
 * 設定フォーム管理フック
 *
 * 設定ページのフォーム状態管理と操作を提供します。
 *
 * @returns 設定フォーム管理機能
 */
export function useSettingsForm(): SettingsFormResult {
  // フォームデータの状態管理
  const [formData, setFormData] = useState<SettingsFormData>({
    bucketName: "",
    endpoint: "",
    region: "auto",
    accessKeyId: "",
    secretAccessKey: ""
  })

  const [isSaving, setIsSaving] = useState(false)
  const validateCreds = useValidateCreds()

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        const result = await window.api.credential.getCredential()
        if (result.success && result.data) {
          setFormData({
            bucketName: result.data.bucketName,
            endpoint: result.data.endpoint,
            region: result.data.region,
            accessKeyId: result.data.accessKeyId,
            secretAccessKey: result.data.secretAccessKey
          })
        }
      } catch (error) {
        console.error("初期データの読み込みに失敗:", error)
      }
    }

    loadInitialData()
  }, [])

  // フィールド更新関数
  const updateField = useCallback((field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // バリデーション
  const fieldErrors = useMemo((): Partial<Record<keyof SettingsFormData, string>> => {
    const errors: Partial<Record<keyof SettingsFormData, string>> = {}

    // バケット名の検証
    if (formData.bucketName.trim() === "") {
      errors.bucketName = "バケット名は必須です"
    } else if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(formData.bucketName)) {
      errors.bucketName = "バケット名の形式が正しくありません"
    }

    // エンドポイントの検証
    if (formData.endpoint.trim() === "") {
      errors.endpoint = "エンドポイントは必須です"
    } else if (!isValidR2OrS3Endpoint(formData.endpoint)) {
      errors.endpoint = "エンドポイントのURL形式が正しくありません"
    }

    // アクセスキーIDの検証
    if (formData.accessKeyId.trim() === "") {
      errors.accessKeyId = "アクセスキーIDは必須です"
    } else if (formData.accessKeyId.length < 10) {
      errors.accessKeyId = "アクセスキーIDが短すぎます"
    }

    // シークレットアクセスキーの検証
    if (formData.secretAccessKey.trim() === "") {
      errors.secretAccessKey = "シークレットアクセスキーは必須です"
    } else if (formData.secretAccessKey.length < 20) {
      errors.secretAccessKey = "シークレットアクセスキーが短すぎます"
    }

    return errors
  }, [formData])

  // 送信可能判定
  const canSubmit = useMemo(() => {
    return (
      Object.keys(fieldErrors).length === 0 &&
      formData.bucketName.trim() !== "" &&
      formData.endpoint.trim() !== "" &&
      formData.accessKeyId.trim() !== "" &&
      formData.secretAccessKey.trim() !== ""
    )
  }, [fieldErrors, formData])

  // 接続テスト
  const testConnection = useCallback(async (): Promise<ApiResult<void>> => {
    if (!isValidR2OrS3Endpoint(formData.endpoint)) {
      return {
        success: false,
        message: "エンドポイントのURLが不正な形式です。"
      }
    }

    const credentialData: Creds = {
      bucketName: formData.bucketName,
      endpoint: formData.endpoint,
      region: formData.region,
      accessKeyId: formData.accessKeyId,
      secretAccessKey: formData.secretAccessKey
    }

    try {
      const result = await window.api.credential.validateCredential(credentialData)
      return result
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "接続テストに失敗しました"
      }
    }
  }, [formData])

  // 保存処理
  const handleSave = useCallback(async (): Promise<void> => {
    if (!canSubmit) {
      toast.error("入力内容にエラーがあります")
      return
    }

    setIsSaving(true)
    const loadingToastId = toast.loading("接続確認中…")

    try {
      // 接続テスト
      const testResult = await testConnection()
      if (!testResult.success) {
        toast.error(testResult.message, { id: loadingToastId })
        return
      }

      // 認証情報の保存
      const credentialData: Creds = {
        bucketName: formData.bucketName,
        endpoint: formData.endpoint,
        region: formData.region,
        accessKeyId: formData.accessKeyId,
        secretAccessKey: formData.secretAccessKey
      }

      const saveResult = await window.api.credential.upsertCredential(credentialData)

      if (saveResult.success) {
        await validateCreds()
        toast.success("設定の保存に成功しました", { id: loadingToastId })
      } else {
        toast.error(saveResult.message, { id: loadingToastId })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存中にエラーが発生しました", {
        id: loadingToastId
      })
    } finally {
      setIsSaving(false)
    }
  }, [canSubmit, formData, testConnection, validateCreds])

  return {
    formData,
    updateField,
    canSubmit,
    isSaving,
    handleSave,
    testConnection,
    fieldErrors
  }
}

export default useSettingsForm
