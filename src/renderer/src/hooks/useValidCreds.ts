import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { isValidCredsAtom } from "@renderer/state/credentials"

export function useValidateCreds(): () => Promise<boolean> {
  const setIsValidCreds = useSetAtom(isValidCredsAtom)

  const validate = useCallback(async () => {
    try {
      const stored = await window.api.credential.getCredential()
      if (!stored) {
        setIsValidCreds(false)
        return false
      }
      const { success } = await window.api.credential.validateCredential(stored)
      setIsValidCreds(success)
      return success
    } catch {
      setIsValidCreds(false)
      return false
    }
  }, [setIsValidCreds])

  return validate
}
