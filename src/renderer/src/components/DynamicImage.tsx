/**
 * @fileoverview 動的画像読み込みコンポーネント
 *
 * このコンポーネントは、ローカル画像とWeb画像の読み込みを統一的に処理し、
 * 画像が存在しない場合にNoImage画像を表示します。
 *
 * 主な機能：
 * - ローカル画像ファイルの読み込み（file://パス、絶対パス対応）
 * - Web画像の読み込み（HTTP/HTTPSパス対応）
 * - 画像未設定時のNoImageフォールバック（トーストなし）
 * - 画像読み込み失敗時のNoImageフォールバック（トーストあり）
 * - ローディング状態の表示
 *
 * 技術的特徴：
 * - Base64エンコード済みのSVGによるNoImage生成
 * - 画像未設定とエラーの適切な区別
 * - React Suspenseライクなローディング表示
 */

import React, { useEffect, useState, ImgHTMLAttributes } from "react"
import toast from "react-hot-toast"
import { ApiResult } from "src/types/result"

// ① ImgHTMLAttributes で <img> の全属性を継承
type DynamicImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string // 普通のURL or ローカルファイルパス（空文字列の場合はNoImage）
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

export default function DynamicImage({
  src: originalSrc,
  ...imgProps
}: DynamicImgProps): React.JSX.Element | null {
  const [dataSrc, setDataSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadImage = async (): Promise<void> => {
      setIsLoading(true)

      // 空文字列または未定義の場合はNoImageを表示（トーストなし）
      if (!originalSrc || originalSrc.trim() === "") {
        if (mounted) {
          setDataSrc(createNoImageDataUrl())
          setIsLoading(false)
        }
        return
      }

      // URLの形式を事前に検証
      const isHttpUrl = originalSrc.startsWith("http://") || originalSrc.startsWith("https://")
      const isFileUrl = originalSrc.startsWith("file://")
      const isAbsolutePath = /^[A-Za-z]:\\/.test(originalSrc) || originalSrc.startsWith("/")

      // 有効なパス形式かチェック
      if (!isHttpUrl && !isFileUrl && !isAbsolutePath) {
        if (mounted) {
          console.warn("無効な画像パス形式:", originalSrc)
          toast.error(`無効な画像パス形式: ${originalSrc}`)
          setDataSrc(createNoImageDataUrl())
          setIsLoading(false)
        }
        return
      }

      // HTTP(S) URLの場合は追加の検証
      if (isHttpUrl) {
        try {
          new URL(originalSrc) // URL形式の検証
        } catch {
          if (mounted) {
            console.warn("無効なURL形式:", originalSrc)
            toast.error(`無効なURL形式: ${originalSrc}`)
            setDataSrc(createNoImageDataUrl())
            setIsLoading(false)
          }
          return
        }
      }

      // file:// か絶対パスならローカル読み込み
      const isLocal = isFileUrl || isAbsolutePath

      try {
        let dataUrl: string | null = null
        let errorMessage: string | null = null

        if (isLocal) {
          const path = originalSrc.replace(/^file:\/\//, "")
          const result = (await window.api.loadImage.loadImageFromLocal(path)) as ApiResult<string>
          if (result.success) {
            dataUrl = result.data ?? null
          } else {
            errorMessage = result.message
          }
        } else {
          const result = (await window.api.loadImage.loadImageFromWeb(
            originalSrc
          )) as ApiResult<string>
          if (result.success) {
            dataUrl = result.data ?? null
          } else {
            errorMessage = result.message
          }
        }

        if (mounted) {
          if (dataUrl) {
            setDataSrc(dataUrl)
          } else {
            // 画像読み込み失敗時はNoImageを表示し、エラートーストも表示
            console.warn("画像読み込み失敗:", originalSrc, errorMessage)
            if (errorMessage) {
              toast.error(`画像読み込み失敗: ${errorMessage}`)
            }
            setDataSrc(createNoImageDataUrl())
          }
          setIsLoading(false)
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading image:", error)
          // 予期しないエラーの場合もトーストを表示
          const errorMsg = error instanceof Error ? error.message : "不明なエラー"
          toast.error(`画像読み込みエラー: ${errorMsg}`)
          setDataSrc(createNoImageDataUrl())
          setIsLoading(false)
        }
      }
    }

    loadImage()
    return () => {
      mounted = false
    }
  }, [originalSrc])

  // ローディング中の表示
  if (isLoading && dataSrc === null) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 text-gray-400"
        style={{
          width: imgProps.width || "100%",
          height: imgProps.height || "200px",
          ...imgProps.style
        }}
      >
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  // 画像またはNoImageを表示
  if (dataSrc) {
    return <img src={dataSrc} {...imgProps} />
  }

  // フォールバック（通常は発生しない）
  return (
    <div
      className="flex items-center justify-center bg-gray-100 text-gray-400"
      style={{
        width: imgProps.width || "100%",
        height: imgProps.height || "200px",
        ...imgProps.style
      }}
    >
      <span className="text-sm">No Image</span>
    </div>
  )
}
