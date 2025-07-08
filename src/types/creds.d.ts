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
  isValidCreds: boolean
  creds: Creds | undefined
  setIsValidCreds: (v: boolean) => void
  reloadCreds: () => Promise<boolean>
}
