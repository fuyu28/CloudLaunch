import type { ReactNode } from "react"

export type FloatingButtonProps = {
  /** ボタン内に表示するアイコンやテキスト */
  children: ReactNode
  /** クリック時のハンドラ */
  onClick: () => void
  /** 画面内での固定位置 （例: "bottom-6 right-6"） */
  positionClass?: string
  /** ボタンの色*/
  btnColor?: string
  /** ボタンの追加クラス */
  className?: string
  /** aria-label */
  ariaLabel?: string
}

export default function FloatingButton({
  children,
  onClick,
  positionClass = "bottom-16 right-6",
  btnColor = "btn-primary",
  className = "",
  ariaLabel
}: FloatingButtonProps): React.JSX.Element {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={`
        fixed ${positionClass} z-50
        h-14 w-14 btn ${btnColor} btn-circle
        flex items-center justify-center
        shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]
        rounded-full active:scale-95
        transition-all duration-200 ease-out
        ${className}
      `}
    >
      {children}
    </button>
  )
}
