/**
 * @fileoverview Zodベースの設定フォーム管理フック
 *
 * このフックは、設定ページのフォーム状態管理と操作を提供します。
 * Zodスキーマを使用して型安全なバリデーションを実現します。
 *
 * 主な機能：
 * - Zodスキーマベースのフォームデータバリデーション
 * - 初期データの読み込み
 * - リアルタイムバリデーション
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
 * } = useSettingsFormZod()
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import toast from "react-hot-toast"
import { ZodError } from "zod"

import { credsSchema } from "../../../schemas/credentials"
import type { Creds } from "../../../types/creds"
import type { ApiResult } from "../../../types/result"

/**
 * 設定フォームデータの型定義（Zodスキーマから生成）
 */
export type SettingsFormData = {
  bucketName: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

/**
 * バリデーションエラーの型定義
 */
export type SettingsValidationErrors = {
  bucketName?: string
  endpoint?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}

/**
 * 設定フォーム管理フックの戻り値
 */
export type SettingsFormResult = {
  /** フォームデータ */
  formData: SettingsFormData
  /** フィールド更新関数 */
  updateField: (field: keyof SettingsFormData, value: string) => void
  /** フォーム全体の更新関数 */
  updateFormData: (data: Partial<SettingsFormData>) => void
  /** 送信可能かどうか */
  canSubmit: boolean
  /** 保存中かどうか */
  isSaving: boolean
  /** データ読み込み中かどうか */
  isLoading: boolean
  /** 接続テスト中かどうか */
  isTesting: boolean
  /** バリデーションエラー */
  errors: SettingsValidationErrors
  /** フィールドエラー（互換性のため） */
  fieldErrors: SettingsValidationErrors
  /** 各フィールドの検証状態 */
  fieldValidation: Record<keyof SettingsFormData, { isValid: boolean; message?: string }>
  /** 保存処理関数 */
  handleSave: () => Promise<void>
  /** 接続テスト関数 */
  testConnection: () => Promise<void>
  /** フォームの初期化 */
  resetForm: () => void
  /** 特定フィールドのバリデーション */
  validateField: (fieldName: keyof SettingsFormData) => string | undefined
}

/**
 * Zodベースの設定フォーム管理フック
 *
 * 設定ページのフォーム状態管理とバリデーションを提供します。
 * Zodスキーマを使用して型安全な検証を実現します。
 *
 * @returns 設定フォーム管理の結果とヘルパー関数
 */
export function useSettingsFormZod(): SettingsFormResult {
  // フォームデータ状態
  const [formData, setFormData] = useState<SettingsFormData>({
    bucketName: "",
    endpoint: "",
    region: "",
    accessKeyId: "",
    secretAccessKey: ""
  })

  // 各種処理状態
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)

  /**
   * 初期データの読み込み
   */
  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const result: ApiResult<Creds> = await window.api.credential.getCredential()

        if (result.success && result.data) {
          setFormData({
            bucketName: result.data.bucketName || "",
            endpoint: result.data.endpoint || "",
            region: result.data.region || "",
            accessKeyId: result.data.accessKeyId || "",
            secretAccessKey: result.data.secretAccessKey || ""
          })
        }
      } catch (error) {
        console.error("初期データの読み込みに失敗しました:", error)
        toast.error("設定の読み込みに失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  /**
   * フィールド単体の更新
   */
  const updateField = useCallback((field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

  /**
   * フォームデータの部分更新
   */
  const updateFormData = useCallback((data: Partial<SettingsFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }))
  }, [])

  /**
   * Zodスキーマを使用したフィールドバリデーション
   */
  const validateField = useCallback(
    (fieldName: keyof SettingsFormData): string | undefined => {
      try {
        const fieldSchema = credsSchema.shape[fieldName]
        if (fieldSchema) {
          fieldSchema.parse(formData[fieldName])
        }
        return undefined
      } catch (error) {
        if (error instanceof ZodError) {
          return error.issues[0]?.message
        }
        return "入力値が無効です"
      }
    },
    [formData]
  )

  /**
   * 全フィールドのバリデーション
   */
  const validateAllFields = useCallback(() => {
    try {
      credsSchema.parse(formData)
      return { isValid: true, errors: {} }
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMap: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName && typeof fieldName === "string") {
            errorMap[fieldName] = issue.message
          }
        })
        return { isValid: false, errors: errorMap }
      }
      return { isValid: false, errors: { general: "バリデーションエラーが発生しました" } }
    }
  }, [formData])

  // 各フィールドのバリデーション状態
  const fieldValidation = useMemo(() => {
    const fieldNames: (keyof SettingsFormData)[] = [
      "bucketName",
      "endpoint",
      "region",
      "accessKeyId",
      "secretAccessKey"
    ]

    return fieldNames.reduce(
      (acc, fieldName) => {
        const errorMessage = validateField(fieldName)
        const isValid = !errorMessage

        acc[fieldName] = {
          isValid,
          message: errorMessage
        }
        return acc
      },
      {} as Record<keyof SettingsFormData, { isValid: boolean; message?: string }>
    )
  }, [validateField])

  // バリデーションエラーオブジェクト
  const errors = useMemo((): SettingsValidationErrors => {
    return {
      bucketName: fieldValidation.bucketName?.message,
      endpoint: fieldValidation.endpoint?.message,
      region: fieldValidation.region?.message,
      accessKeyId: fieldValidation.accessKeyId?.message,
      secretAccessKey: fieldValidation.secretAccessKey?.message
    }
  }, [fieldValidation])

  // 送信可能状態の判定
  const canSubmit = useMemo(() => {
    const validationResult = validateAllFields()
    return validationResult.isValid && !isSaving && !isTesting
  }, [validateAllFields, isSaving, isTesting])

  /**
   * 設定保存処理
   */
  const handleSave = useCallback(async () => {
    if (!canSubmit) {
      toast.error("入力内容に問題があります")
      return
    }

    setIsSaving(true)
    try {
      const result: ApiResult = await window.api.credential.upsertCredential(formData)

      if (result.success) {
        toast.success("設定を保存しました")
      } else {
        toast.error(result.message || "設定の保存に失敗しました")
      }
    } catch (error) {
      console.error("設定保存エラー:", error)
      toast.error("設定の保存中にエラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }, [formData, canSubmit])

  /**
   * 接続テスト処理
   */
  const testConnection = useCallback(async () => {
    if (!canSubmit) {
      toast.error("すべての項目を正しく入力してください")
      return
    }

    setIsTesting(true)
    try {
      const result: ApiResult = await window.api.credential.validateCredential(formData)

      if (result.success) {
        toast.success("接続テストに成功しました")
      } else {
        toast.error(result.message || "接続テストに失敗しました")
      }
    } catch (error) {
      console.error("接続テストエラー:", error)
      toast.error("接続テスト中にエラーが発生しました")
    } finally {
      setIsTesting(false)
    }
  }, [formData, canSubmit])

  /**
   * フォームのリセット
   */
  const resetForm = useCallback(() => {
    setFormData({
      bucketName: "",
      endpoint: "",
      region: "",
      accessKeyId: "",
      secretAccessKey: ""
    })
  }, [])

  return {
    formData,
    updateField,
    updateFormData,
    canSubmit,
    isSaving,
    isLoading,
    isTesting,
    errors,
    fieldErrors: errors, // 互換性のため
    fieldValidation,
    handleSave,
    testConnection,
    resetForm,
    validateField
  }
}

export default useSettingsFormZod
