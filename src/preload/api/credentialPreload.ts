import { ipcRenderer } from "electron"

import type { Creds } from "../../types/creds"
import type { AwsSdkError } from "../../types/error"
import type { ApiResult } from "../../types/result"

export const credentialAPI = {
  upsertCredential: (creds: Creds): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("upsert-credential", creds),
  getCredential: (): Promise<ApiResult<Creds>> => ipcRenderer.invoke("get-credential"),
  validateCredential: (creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }> =>
    ipcRenderer.invoke("validate-credential", creds)
}
