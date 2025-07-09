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
 * - useImageLoaderフックを使用した分離されたロジック
 * - メモ化による不要な再レンダリング防止
 * - React Suspenseライクなローディング表示
 */

import React, { memo, ImgHTMLAttributes } from "react"
import { useImageLoader } from "@renderer/hooks/useImageLoader"

// ① ImgHTMLAttributes で <img> の全属性を継承
type DynamicImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string // 普通のURL or ローカルファイルパス（空文字列の場合はNoImage）
}

/**
 * 動的画像読み込みコンポーネント
 *
 * @param props - 画像要素のプロパティ
 * @returns 画像要素またはローディング要素
 */
const DynamicImage = memo(function DynamicImage({
  src: originalSrc,
  ...imgProps
}: DynamicImgProps): React.JSX.Element {
  const { imageSrc, isLoading } = useImageLoader(originalSrc)

  // ローディング中の表示
  if (isLoading && !imageSrc) {
    return (
      <div
        className="flex items-center justify-center bg-base-200 text-base-content"
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
  if (imageSrc) {
    return <img src={imageSrc} {...imgProps} />
  }

  // フォールバック（通常は発生しない）
  return (
    <div
      className="flex items-center justify-center bg-gray-100 text-base-content"
      style={{
        width: imgProps.width || "100%",
        height: imgProps.height || "200px",
        ...imgProps.style
      }}
    >
      <span className="text-sm">No Image</span>
    </div>
  )
})

export default DynamicImage
