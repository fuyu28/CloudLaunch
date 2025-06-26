declare namespace NodeJS {
  interface ProcessEnv {
    readonly BUCKET_NAME: string
    readonly REGION: string
    readonly ENDPOINT: string
    readonly ACCESS_KEY_ID: string
    readonly SECRET_ACCESS_KEY: string
  }
}
