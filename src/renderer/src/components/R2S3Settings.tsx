/**
 * @fileoverview R2/S3設定コンポーネント
 *
 * クラウドストレージ（R2/S3）の設定を管理するコンポーネントです。
 *
 * 主な機能：
 * - R2/S3接続情報の設定
 * - 接続状態の表示
 * - バリデーション機能
 * - 設定の保存
 *
 * 使用技術：
 * - useSettingsForm カスタムフック
 * - useConnectionStatus カスタムフック
 * - SettingsFormField コンポーネント
 */

import React, { useEffect } from "react"
import { useSettingsForm } from "../hooks/useSettingsForm"
import { useConnectionStatus } from "../hooks/useConnectionStatus"
import { FaCheck, FaSyncAlt, FaTimes } from "react-icons/fa"
import SettingsFormField from "./SettingsFormField"

/**
 * R2/S3設定コンポーネント
 *
 * クラウドストレージの接続設定を管理します。
 *
 * @returns R2/S3設定コンポーネント要素
 */
export default function R2S3Settings(): React.JSX.Element {
  const { formData, updateField, canSubmit, isSaving, handleSave, fieldErrors } = useSettingsForm()
  const { status, message, check } = useConnectionStatus()

  // 初回マウント時に接続チェック
  useEffect(() => {
    check()
  }, [check])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
        R2/S3 設定
        <div className="text-sm flex items-center space-x-1">
          {status === "loading" && (
            <FaSyncAlt className="animate-spin text-gray-600 dark:text-gray-300" />
          )}
          {status === "success" && <FaCheck className="text-green-600 dark:text-green-400" />}
          {status === "error" && <FaTimes className="text-red-600 dark:text-red-400" />}
          <span className="text-base-content/80">
            {status === "loading" ? "接続確認中..." : status === "success" ? "接続OK" : message}
          </span>
        </div>
      </h2>

      <div className="flex flex-col space-y-4 mt-4">
        {/* フォームフィールド群 */}
        <SettingsFormField
          label="Bucket Name"
          value={formData.bucketName}
          onChange={(value) => updateField("bucketName", value)}
          placeholder="バケット名を入力"
          required
          error={fieldErrors.bucketName}
          helpText="S3互換ストレージのバケット名"
        />

        <SettingsFormField
          label="Endpoint"
          value={formData.endpoint}
          onChange={(value) => updateField("endpoint", value)}
          placeholder="https://<アカウント>.r2.cloudflarestorage.com"
          required
          error={fieldErrors.endpoint}
          helpText="R2またはS3互換ストレージのエンドポイントURL"
        />

        <SettingsFormField
          label="Region"
          value={formData.region}
          onChange={(value) => updateField("region", value)}
          placeholder="auto"
          helpText="ストレージのリージョン（通常は auto で問題ありません）"
        />

        <SettingsFormField
          label="Access Key ID"
          value={formData.accessKeyId}
          onChange={(value) => updateField("accessKeyId", value)}
          placeholder="アクセスキーを入力"
          required
          error={fieldErrors.accessKeyId}
          helpText="ストレージアクセス用のアクセスキーID"
        />

        <SettingsFormField
          label="Secret Access Key"
          value={formData.secretAccessKey}
          onChange={(value) => updateField("secretAccessKey", value)}
          placeholder="シークレットアクセスキーを入力"
          type="password"
          required
          error={fieldErrors.secretAccessKey}
          helpText="ストレージアクセス用のシークレットキー"
        />
      </div>

      <div className="form-control mt-6 flex justify-end">
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSubmit || isSaving}>
          保存
        </button>
      </div>
    </div>
  )
}
