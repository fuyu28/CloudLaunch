import React, { useEffect, useState, ImgHTMLAttributes } from "react"

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
        let dataUrl: string | null
        if (isLocal) {
          // ローカル画像の場合fsでnodeからロード
          const path = originalSrc.replace(/^file:\/\//, "")
          dataUrl = await window.api.loadImage.loadImageFromLocal(path)
        } else {
          // Web画像の場合fetchしてnodeからロード
          dataUrl = await window.api.loadImage.loadImageFromWeb(originalSrc)
        }
        if (mounted) {
          setDataSrc(dataUrl)
          if (!dataUrl) {
            console.warn("画像読み込み失敗:", originalSrc)
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

  if (!dataSrc) return null
  return <img src={dataSrc} {...imgProps} />
}
