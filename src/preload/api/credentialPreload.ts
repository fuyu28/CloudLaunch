import { ipcRenderer } from "electron"
import type { Creds } from "../../types/creds"
import { AwsSdkError } from "../../types/error"

export const credentialAPI = {
  upsertCredential: (creds: Creds): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("upsert-credential", creds),
  getCredential: (): Promise<Creds | null> => ipcRenderer.invoke("get-credential"),
  validateCredential: (creds: Creds): Promise<{ success: boolean; err?: AwsSdkError }> =>
    ipcRenderer.invoke("validate-credential", creds)
}
