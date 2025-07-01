import { useEffect } from "react"
import { useAtom } from "jotai"
import { isValidCredsAtom } from "@renderer/state/atoms"
import type { Creds } from "src/types/creds"

export function useIsValidCreds(): boolean {
  const [isValidCreds, setIsValidCreds] = useAtom(isValidCredsAtom)

  useEffect(() => {
    ;(async () => {
      const creds: Creds | null = await window.api.credential.getCredential()
      setIsValidCreds(creds !== null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isValidCreds
}
