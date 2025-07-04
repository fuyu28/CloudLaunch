import { useEffect, useState } from "react"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import { useSettingsForm } from "@renderer/hooks/useSettingsForm"
import { FaCheck, FaSyncAlt, FaTimes } from "react-icons/fa"
import SettingsFormField from "@renderer/components/SettingsFormField"

export default function Settings(): React.JSX.Element {
  // カスタムフック
  const validateCreds = useValidateCreds()
  const { formData, updateField, canSubmit, isSaving, handleSave, fieldErrors } = useSettingsForm()

  // 接続ステータス管理
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // 初回マウント時に接続チェック
  useEffect(() => {
    const checkConnection = async (): Promise<void> => {
      setStatus("loading")
      const ok = await validateCreds()
      if (ok) {
        setStatus("success")
      } else {
        setStatus("error")
        setStatusMessage("クレデンシャルが有効ではありません")
      }
    }

    checkConnection()
  }, [validateCreds])

  return (
    <div className="relative container mx-auto px-6 mt-10">
      <div className="card w-full bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-2 flex items-center justify-between">
            R2/S3 設定
            <div className="text-sm flex items-center space-x-1">
              {status === "loading" && (
                <FaSyncAlt className="animate-spin text-gray-600 dark:text-gray-300" />
              )}
              {status === "success" && <FaCheck className="text-green-600 dark:text-green-400" />}
              {status === "error" && <FaTimes className="text-red-600 dark:text-red-400" />}
              <span className="text-gray-800 dark:text-gray-200">
                {status === "loading"
                  ? "接続確認中..."
                  : status === "success"
                    ? "接続OK"
                    : statusMessage}
              </span>
            </div>
          </h2>

          <div className="flex flex-col space-y-4">
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
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!canSubmit || isSaving}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
