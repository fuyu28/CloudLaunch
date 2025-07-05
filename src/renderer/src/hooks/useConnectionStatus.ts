import { useCallback, useEffect, useState } from "react"
import { useValidateCreds } from "./useValidCreds"
import { AsyncStatus } from "src/types/common"

export interface ConnectionStatusResult {
  status: AsyncStatus
  message: string | null
  check: () => Promise<void>
}

export function useConnectionStatus(): ConnectionStatusResult {
  const validateCreds = useValidateCreds()
  const [status, setStatus] = useState<AsyncStatus>("loading")
  const [message, setMessage] = useState<string | null>(null)

  const check: () => Promise<void> = useCallback(async () => {
    setStatus("loading")
    const ok = await validateCreds()
    if (ok) {
      setStatus("success")
      setMessage(null)
    } else {
      setStatus("error")
      setMessage("クレデンシャルが有効ではありません")
    }
  }, [validateCreds])

  useEffect(() => {
    check()
  }, [check])

  return { status, message, check }
}
