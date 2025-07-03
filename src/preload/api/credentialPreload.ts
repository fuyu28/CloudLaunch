import { ipcRenderer } from "electron"
import type { Creds } from "../../types/creds"
import { ApiResult } from "../../types/result"
import { AwsSdkError } from "../../types/error"

export const credentialAPI = {
  upsertCredential: (creds: Creds): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("upsert-credential", creds),
  getCredential: (): Promise<Creds | null> => ipcRenderer.invoke("get-credential"),
  validateCredential: (creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }> =>
    ipcRenderer.invoke("validate-credential", creds)
}
