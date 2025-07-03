import { useState, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import { isValidR2OrS3Endpoint } from "@renderer/utils/endpointValidator"
import { useValidateCreds } from "@renderer/hooks/useValidCreds"
import { FaCheck, FaSyncAlt, FaTimes } from "react-icons/fa"
import { ApiResult } from "src/types/result"

export default function Settings(): React.JSX.Element {
  // --- 既存の state ---
  const [bucketName, setBucketName] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [region, setRegion] = useState("auto")
  const [accessKeyId, setAccessKeyId] = useState("")
  const [secretAccessKey, setSecretAccessKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // カスタムフックから接続チェック関数
  const validateCreds = useValidateCreds()

  // ステータス管理: loading → success / error
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // 初回マウント時に接続チェック
  useEffect(() => {
    ;(async () => {
      setStatus("loading")
      const ok = await validateCreds()
      if (ok) {
        setStatus("success")
      } else {
        setStatus("error")
        setStatusMessage("クレデンシャルが有効ではありません")
      }
    })()
  }, [validateCreds])

  // 初回マウント時に既存のデータを表示
  useEffect(() => {
    ;(async () => {
      const result = await window.api.credential.getCredential()
      if (result.success && result.data) {
        setBucketName(result.data.bucketName)
        setEndpoint(result.data.endpoint)
        setRegion(result.data.region)
        setAccessKeyId(result.data.accessKeyId)
        setSecretAccessKey(result.data.secretAccessKey)
      }
    })()
  }, [])

  // --- 既存の canSubmit や toastクリアなど ---
  const canSubmit = useMemo(
    () =>
      bucketName.trim() !== "" &&
      isValidR2OrS3Endpoint(endpoint) &&
      accessKeyId.trim() !== "" &&
      secretAccessKey.trim() !== "",
    [bucketName, endpoint, accessKeyId, secretAccessKey]
  )

  // 疎通確認
  const testConnection = async (): Promise<ApiResult<void>> => {
    if (!isValidR2OrS3Endpoint(endpoint)) {
      return {
        success: false,
        message: "エンドポイントのURLが不正な形式です。"
      }
    }
    const res = await window.api.credential.validateCredential({
      bucketName,
      endpoint,
      region,
      accessKeyId,
      secretAccessKey
    })
    return res
  }

  // 保存ハンドラ
  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    const loadingToastId = toast.loading("接続確認中…")
    try {
      const test = await testConnection()
      if (!test.success) {
        toast.error(test.message, { id: loadingToastId })
        return
      }
      const res = await window.api.credential.upsertCredential({
        bucketName,
        endpoint,
        region,
        accessKeyId,
        secretAccessKey
      })
      if (res.success) {
        await validateCreds()
        toast.success("設定の保存に成功しました", { id: loadingToastId })
      } else {
        toast.error(res.message, { id: loadingToastId })
      }
    } finally {
      setIsSaving(false)
    }
  }

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
            <div className="flex items-center">
              <span className="w-36 text-sm font-medium">Bucket Name</span>
              <input
                type="text"
                className="input input-bordered flex-1"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                placeholder="バケット名を入力"
              />
            </div>
            <div className="flex items-center">
              <span className="w-36 text-sm font-medium">Endpoint</span>
              <input
                type="text"
                className="input input-bordered flex-1"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://<アカウント>.r2.cloudflarestorage.com"
              />
            </div>
            <div className="flex items-center">
              <span className="w-36 text-sm font-medium">Region</span>
              <input
                type="text"
                className="input input-bordered flex-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="flex items-center">
              <span className="w-36 text-sm font-medium">Access Key ID</span>
              <input
                type="text"
                className="input input-bordered flex-1"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                placeholder="アクセスキーを入力"
              />
            </div>
            <div className="flex items-center">
              <span className="w-36 text-sm font-medium">Secret Access Key</span>
              <input
                type="password"
                className="input input-bordered flex-1"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                placeholder="シークレットアクセスキーを入力"
              />
            </div>
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
