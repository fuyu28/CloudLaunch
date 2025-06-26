import { useEffect, useState } from "react"
import type { Creds } from "src/types/creds"

export function useHasCreds(): boolean {
  const [hasCreds, setHasCreds] = useState(false)

  useEffect(() => {
    ;(async () => {
      const creds: Creds | null = await window.api.credential.getCredential()
      setHasCreds(creds !== null)
    })()
  }, [])

  return hasCreds
}
