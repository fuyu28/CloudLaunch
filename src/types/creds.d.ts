export interface Schema {
  bucketName: string
  region: string
  endpoint: string
  accessKeyId: string
}

export interface Creds extends Schema {
  secretAccessKey: string
}

export interface CredsContextType {
  hasValidCreds: boolean
  creds: Creds | null
  setHasValidCreds: (v: boolean) => void
  reloadCreds: () => Promise<boolean>
}
