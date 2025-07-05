// awsErrorHandler.ts
import { S3ServiceException } from "@aws-sdk/client-s3"
import { AwsSdkError } from "../../types/error"
import { logger } from "./logger"
import { MESSAGES } from "../../constants"

/**
 * AWS SDK のエラーを一元処理する．
 *
 * @param error  キャッチしたエラーオブジェクト
 * @returns エラーコードとエラーメッセージ
 */
export function handleAwsSdkError(error: unknown): AwsSdkError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any

  if (error instanceof S3ServiceException) {
    switch (err.Code) {
      case "NoSuchBucket":
        return { Code: err.Code, message: "バケットが存在しません。" }
      case "InvalidRegionName":
        return { Code: err.Code, message: "リージョン名が正しくありません。" }
      case "InvalidArgument":
        return { Code: err.Code, message: "アクセスキーIDが正しくありません。" }
      case "SignatureDoesNotMatch":
        return { Code: err.Code, message: "認証情報が正しくありません。" }
      default:
        if (err.Code !== undefined) return { Code: err.Code, message: "その他のエラーです。" }
        else {
          logger.error(MESSAGES.AWS.NETWORK_ERROR, err)
          return { Code: err.Code, message: MESSAGES.ERROR.GENERAL }
        }
    }
  } else {
    if (err.code === "ENOTFOUND")
      return {
        Code: err.code,
        message: MESSAGES.AWS.NETWORK_ERROR
      }
    else {
      logger.error(MESSAGES.AWS.NETWORK_ERROR, err)
      return { Code: err.code, message: MESSAGES.ERROR.GENERAL }
    }
  }
}
