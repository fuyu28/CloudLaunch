/**
 * @fileoverview 画像読み込み管理用カスタムフック
 *
 * このフックは画像の読み込み状態を管理し、エラーハンドリングを行います。
 *
 * 主な機能：
 * - ローカル画像とWeb画像の読み込み
 * - 画像未設定時のNoImageフォールバック
 * - 読み込み失敗時のエラーハンドリング
 * - マウント状態の管理
 */

import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import type { ApiResult } from "src/types/result"

/**
 * 画像読み込み状態の型定義
 */
interface ImageLoadState {
  /** 読み込み済み画像のdata URL */
  imageSrc?: string
  /** 読み込み中フラグ */
  isLoading: boolean
  /** エラー状態 */
  error?: string
}

/**
 * NoImage SVGをbase64エンコードしたdata URL
 * 灰色の背景に "No Image" テキストが表示される
 */
const createNoImageDataUrl = (): string => {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" 
            fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
        No Image
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * 画像読み込み管理用カスタムフック
 *
 * @param src - 読み込む画像のパス（空文字列の場合はNoImage）
 * @returns 画像読み込み状態
 */
export const useImageLoader = (src: string): ImageLoadState => {
  const [state, setState] = useState<ImageLoadState>(() => ({
    imageSrc: undefined,
    isLoading: true,
    error: undefined
  }))

  useEffect(() => {
    let mounted = true

    const loadImage = async (): Promise<void> => {
      if (!mounted) return

      setState((prev) => ({ ...prev, isLoading: true, error: undefined }))

      // 空文字列または未定義の場合はNoImageを表示（トーストなし）
      if (!src || src.trim() === "") {
        if (mounted) {
          setState({
            imageSrc: createNoImageDataUrl(),
            isLoading: false,
            error: undefined
          })
        }
        return
      }

      try {
        const result = await validateAndLoadImage(src)

        if (mounted) {
          if (result.success && result.data) {
            setState({
              imageSrc: result.data,
              isLoading: false,
              error: undefined
            })
          } else {
            // 画像読み込み失敗時はNoImageを表示し、エラートーストも表示
            const errorMessage = result.success ? "データが取得できませんでした" : result.message
            console.warn("画像読み込み失敗:", src, errorMessage)
            if (errorMessage) {
              toast.error(`画像読み込み失敗: ${errorMessage}`)
            }
            setState({
              imageSrc: createNoImageDataUrl(),
              isLoading: false,
              error: errorMessage || "画像読み込みに失敗しました"
            })
          }
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading image:", error)
          const errorMsg = error instanceof Error ? error.message : "不明なエラー"
          toast.error(`画像読み込みエラー: ${errorMsg}`)
          setState({
            imageSrc: createNoImageDataUrl(),
            isLoading: false,
            error: errorMsg
          })
        }
      }
    }

    loadImage()
    return () => {
      mounted = false
    }
  }, [src])

  return state
}

/**
 * 画像パスを検証し、適切なAPIを呼び出して画像を読み込む
 *
 * @param src - 画像パス
 * @returns 画像読み込み結果
 */
const validateAndLoadImage = async (src: string): Promise<ApiResult<string>> => {
  // URLの形式を事前に検証
  const isHttpUrl = src.startsWith("http://") || src.startsWith("https://")
  const isFileUrl = src.startsWith("file://")
  const isAbsolutePath = /^[A-Za-z]:\\/.test(src) || src.startsWith("/")

  // 有効なパス形式かチェック
  if (!isHttpUrl && !isFileUrl && !isAbsolutePath) {
    return {
      success: false,
      message: `無効な画像パス形式: ${src}`
    }
  }

  // HTTP(S) URLの場合は追加の検証
  if (isHttpUrl) {
    try {
      new URL(src) // URL形式の検証
    } catch {
      return {
        success: false,
        message: `無効なURL形式: ${src}`
      }
    }
  }

  // file:// か絶対パスならローカル読み込み
  const isLocal = isFileUrl || isAbsolutePath

  try {
    if (isLocal) {
      const path = src.replace(/^file:\/\//, "")
      const result = (await window.api.loadImage.loadImageFromLocal(path)) as ApiResult<string>
      return result
    } else {
      const result = (await window.api.loadImage.loadImageFromWeb(src)) as ApiResult<string>
      return result
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "不明なエラー"
    }
  }
}
