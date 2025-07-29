import { createAppError } from "./errorHandler"
import { MESSAGES } from "../../constants"

export type ValidationResult = {
  isValid: boolean
  errors: string[]
}

export function validateRequired(value: string | undefined, fieldName: string): ValidationResult {
  if (!value || value.trim() === "") {
    return {
      isValid: false,
      errors: [`${fieldName}は必須です`]
    }
  }
  return { isValid: true, errors: [] }
}

export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      errors: [`${fieldName}は${minLength}文字以上で入力してください`]
    }
  }
  return { isValid: true, errors: [] }
}

export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationResult {
  if (value.length > maxLength) {
    return {
      isValid: false,
      errors: [`${fieldName}は${maxLength}文字以下で入力してください`]
    }
  }
  return { isValid: true, errors: [] }
}

export function validateUrl(value: string, fieldName: string): ValidationResult {
  try {
    new URL(value)
    return { isValid: true, errors: [] }
  } catch {
    return {
      isValid: false,
      errors: [`${fieldName}は有効なURLを入力してください`]
    }
  }
}

export function validateSteamUrl(value: string): ValidationResult {
  const steamUrlPattern = /^steam:\/\/rungameid\/([0-9]+)$/
  if (!steamUrlPattern.test(value)) {
    return {
      isValid: false,
      errors: [MESSAGES.VALIDATION.INVALID_STEAM_URL]
    }
  }
  return { isValid: true, errors: [] }
}

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((result) => result.errors)
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

export function validateGameInput(input: {
  title?: string
  publisher?: string
  exePath?: string
  imagePath?: string
  saveFolderPath?: string
}): ValidationResult {
  const titleValidation = validateRequired(input.title, "タイトル")
  const publisherValidation = validateRequired(input.publisher, "パブリッシャー")
  const exePathValidation = validateRequired(input.exePath, "実行ファイルパス")

  const titleLengthValidation = input.title
    ? validateMaxLength(input.title, 200, "タイトル")
    : { isValid: true, errors: [] }

  const publisherLengthValidation = input.publisher
    ? validateMaxLength(input.publisher, 100, "パブリッシャー")
    : { isValid: true, errors: [] }

  return combineValidationResults(
    titleValidation,
    publisherValidation,
    exePathValidation,
    titleLengthValidation,
    publisherLengthValidation
  )
}

export function validateCredentialInput(input: {
  bucketName?: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
}): ValidationResult {
  const bucketNameValidation = validateRequired(input.bucketName, "バケット名")
  const regionValidation = validateRequired(input.region, "リージョン")
  const endpointValidation = validateRequired(input.endpoint, "エンドポイント")
  const accessKeyIdValidation = validateRequired(input.accessKeyId, "アクセスキーID")
  const secretAccessKeyValidation = validateRequired(
    input.secretAccessKey,
    "シークレットアクセスキー"
  )

  const endpointUrlValidation = input.endpoint
    ? validateUrl(input.endpoint, "エンドポイント")
    : { isValid: true, errors: [] }

  return combineValidationResults(
    bucketNameValidation,
    regionValidation,
    endpointValidation,
    accessKeyIdValidation,
    secretAccessKeyValidation,
    endpointUrlValidation
  )
}

export function throwValidationError(validationResult: ValidationResult, context?: string): never {
  if (!validationResult.isValid) {
    const message = validationResult.errors.join(", ")
    throw createAppError("UNEXPECTED", message, context)
  }
  throw new Error(MESSAGES.ERROR.UNEXPECTED)
}
