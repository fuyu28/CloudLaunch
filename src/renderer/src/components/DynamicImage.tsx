import React, { useEffect, useState, ImgHTMLAttributes } from "react"

// ① ImgHTMLAttributes で <img> の全属性を継承
type DynamicImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string // 普通のURL or ローカルファイルパス
}

export default function DynamicImage({
  src: originalSrc,
  ...imgProps
}: DynamicImgProps): React.JSX.Element {
  const [src, setSrc] = useState<string>("")

  useEffect(() => {
    // file:// か絶対パスならローカル読み込み
    const isLocal =
      originalSrc.startsWith("file://") ||
      /^[A-Za-z]:\\/.test(originalSrc) ||
      originalSrc.startsWith("/")

    if (isLocal) {
      // ローカルの場合fsを使ってバックからロード
      window.api.loadImage.loadImage(originalSrc.replace(/^file:\/\//, "")).then((dataUrl) => {
        if (dataUrl) setSrc(dataUrl)
        else {
          console.warn("画像読み込み失敗:", originalSrc)
          setSrc("")
        }
      })
    } else {
      // 通常のURLならそのまま
      setSrc(originalSrc)
    }
  }, [originalSrc])

  return <img src={src} {...imgProps} />
}
