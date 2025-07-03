import React, { useEffect, useState, ImgHTMLAttributes } from "react"
import toast from "react-hot-toast"
import { ApiResult } from "src/types/result"

// ① ImgHTMLAttributes で <img> の全属性を継承
type DynamicImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string // 普通のURL or ローカルファイルパス
}

export default function DynamicImage({
  src: originalSrc,
  ...imgProps
}: DynamicImgProps): React.JSX.Element | null {
  const [dataSrc, setDataSrc] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadImage = async (): Promise<void> => {
      // file:// か絶対パスならローカル読み込み
      const isLocal =
        originalSrc.startsWith("file://") ||
        /^[A-Za-z]:\\/.test(originalSrc) ||
        originalSrc.startsWith("/")
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
          setDataSrc(dataUrl)
          if (!dataUrl && errorMessage) {
            console.warn("画像読み込み失敗:", originalSrc, errorMessage)
            toast.error(`画像読み込み失敗: ${errorMessage}`)
          }
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading image:", error)
          setDataSrc(null)
        }
      }
    }

    loadImage()
    return () => {
      mounted = false
    }
  }, [originalSrc])

  if (dataSrc === null) {
    return (
      <div style={{ display: "inline-block", textAlign: "center" }}>
        <span>Loading...</span>
        <img alt={imgProps.alt || "Image loading"} style={{ visibility: "hidden" }} />
      </div>
    )
  }
  return <img src={dataSrc} {...imgProps} />
}
