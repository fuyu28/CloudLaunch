import { useEffect } from "react"
import { useAtom, useSetAtom } from "jotai"
import { AwsSdkError } from "src/types/error"
import { isValidR2OrS3Endpoint } from "@renderer/utils/endpointValidator"
import {
  accessKeyIdAtom,
  bucketNameAtom,
  credsAtom,
  endpointAtom,
  regionAtom,
  reloadCredsAtom,
  secretAccessKeyAtom,
  toastAtom
} from "@renderer/state/atoms"

export default function Settings(): React.JSX.Element {
  const [bucketName, setBucketName] = useAtom(bucketNameAtom)
  const [endpoint, setEndpoint] = useAtom(endpointAtom)
  const [region, setRegion] = useAtom(regionAtom)
  const [accessKeyId, setAccessKeyId] = useAtom(accessKeyIdAtom)
  const [secretAccessKey, setSecretAccessKey] = useAtom(secretAccessKeyAtom)
  const [toast, setToast] = useAtom<{ message: string; type: "success" | "error" } | null>(
    toastAtom
  )

  const [creds] = useAtom(credsAtom)
  const reloadCreds = useSetAtom(reloadCredsAtom)

  // Toast の自動クリア
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  // 初回ロード時に既存 creds を反映
  useEffect(() => {
    if (creds) {
      setBucketName(creds.bucketName)
      setEndpoint(creds.endpoint)
      setRegion(creds.region)
      setAccessKeyId(creds.accessKeyId)
      setSecretAccessKey(creds.secretAccessKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds])

  /** 入力された設定で疎通確認を行う関数 */
  const testConnection = async (): Promise<{ success: boolean; err?: AwsSdkError }> => {
    if (!isValidR2OrS3Endpoint(endpoint))
      return {
        success: false,
        err: { Code: "InvalidEndpoint", message: "エンドポイントのURLが不正な形式です。" }
      }
    const res = await window.api.credential.testCredential({
      bucketName,
      endpoint,
      region,
      accessKeyId,
      secretAccessKey
    })
    if (res.success) return { success: true }
    else return { success: false, err: res.err }
  }

  /** 保存ボタンハンドラ */
  const handleSave = async (): Promise<void> => {
    setToast(null)

    // 1) まず疎通確認
    setToast({ message: "接続確認中…", type: "success" })
    const test = await testConnection()
    if (!test.success) {
      setToast({ message: `${test.err?.Code}\n${test.err?.message}`, type: "error" })
      return
    }

    // 2) 接続 OK ならストレージへ書き込み
    const res = await window.api.credential.setCredential({
      bucketName,
      endpoint,
      region,
      accessKeyId,
      secretAccessKey
    })
    if (res.success) {
      await reloadCreds()
      setToast({ message: "設定の保存に成功しました", type: "success" })
    } else {
      setToast({ message: "設定の保存に失敗しました", type: "error" })
    }
  }

  return (
    <div className="relative container mx-auto px-6 mt-10">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 alert shadow-lg ${
            toast.type === "success" ? "alert-success" : "alert-error"
          } animate-fade-in-down`}
        >
          <span className="whitespace-pre-line">{toast.message}</span>
        </div>
      )}

      <div className="card w-full bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">R2/S3 設定</h2>
          <div className="flex flex-col space-y-4">
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
            <button className="btn btn-primary" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
