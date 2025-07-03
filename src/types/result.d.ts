export type ApiResult<T = void> = { success: true; data?: T } | { success: false; message: string }
