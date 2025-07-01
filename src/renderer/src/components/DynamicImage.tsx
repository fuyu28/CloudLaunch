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
      // preload で expose した api.loadImage を呼ぶ
      window.api.loadImage.loadImage(originalSrc.replace(/^file:\/\//, "")).then((dataUrl) => {
        if (dataUrl) setSrc(dataUrl)
        else {
          console.warn("画像読み込み失敗:", originalSrc)
          setSrc("") // フォールバックさせる場合は別途
        }
      })
    } else {
      // 通常のURLならそのまま
      setSrc(originalSrc)
    }
  }, [originalSrc])

  // 読み込み中や失敗時は空の <img> でも良いし、プレースホルダー表示でも OK
  return <img src={src} {...imgProps} />
}
