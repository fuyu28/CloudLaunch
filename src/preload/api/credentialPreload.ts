import { ipcRenderer } from "electron"

import type { Creds } from "../../types/creds"
import type { AwsSdkError } from "../../types/error"
import type { ApiResult } from "../../types/result"

export const credentialAPI = {
  upsertCredential: (creds: Creds): Promise<ApiResult<void>> =>
    ipcRenderer.invoke("credential:upsert", creds),
  getCredential: (): Promise<ApiResult<Creds>> => ipcRenderer.invoke("credential:get"),
  validateCredential: (creds: Creds): Promise<ApiResult<void> & { err?: AwsSdkError }> =>
    ipcRenderer.invoke("credential:validate", creds)
}
