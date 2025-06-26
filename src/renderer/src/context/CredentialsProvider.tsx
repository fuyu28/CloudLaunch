import { useState, ReactNode, useEffect } from "react"
import { CredentialsContext } from "./CredentialsContext"
import type { Creds } from "src/types/creds"

export function CredentialsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [creds, setCreds] = useState<Creds | null>(null)
  const [hasValidCreds, setHasValidCreds] = useState(false)

  useEffect(() => {
    reloadCreds()
  }, [])

  const reloadCreds = async (): Promise<boolean> => {
    try {
      const stored = await window.api.credential.getCredential()
      const list = await window.api.getR2FolderList.getR2FolderList()
      const valid = list !== null
      setCreds(valid ? stored : null)
      setHasValidCreds(valid)
      return valid
    } catch (err) {
      console.error(`Creds load failed\n${err}`)
      setCreds(null)
      setHasValidCreds(false)
      return false
    }
  }
  return (
    <CredentialsContext.Provider value={{ hasValidCreds, creds, setHasValidCreds, reloadCreds }}>
      {children}
    </CredentialsContext.Provider>
  )
}
