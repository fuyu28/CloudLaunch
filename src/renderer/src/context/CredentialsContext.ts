import { createContext, useContext } from "react"
import type { CredsContextType } from "src/types/creds"

export const CredentialsContext = createContext<CredsContextType | null>(null)

export function useCredentials(): CredsContextType {
  const ctx = useContext(CredentialsContext)
  if (!ctx) throw new Error("useCredentials must be inside CredentialsProvider")
  return ctx
}
