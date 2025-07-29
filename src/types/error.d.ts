export type AwsSdkError = {
  Code: string
  message: string
}

export enum FileValidationError {
  NotFound = "NotFound",
  NoPermission = "NoPermission",
  InvalidExtension = "InvalidExtension",
  NotDir = "NotADirectory",
  Unknown = "Unknown"
}
