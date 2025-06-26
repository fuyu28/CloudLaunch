import { ipcRenderer } from "electron"
import type { Creds } from "../../types/creds"
import { AwsSdkError } from "../../types/error"

export const credentialAPI = {
  setCredential: (creds: Creds): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("set-credential", creds),
  getCredential: (): Promise<Creds | null> => ipcRenderer.invoke("get-credential"),
  testCredential: (creds: Creds): Promise<{ success: boolean; err?: AwsSdkError }> =>
    ipcRenderer.invoke("test-credential", creds)
}
