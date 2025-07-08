/**
 * @fileoverview ベースモーダルコンポーネント
 *
 * このコンポーネントは、アプリケーション内で使用されるモーダルの基本構造を提供します。
 *
 * 主な機能：
 * - DaisyUI モーダルの基本構造
 * - 閉じるボタンの統一
 * - クリックアウトサイド対応
 * - カスタマイズ可能なヘッダー・フッター
 * - サイズとスタイルのオプション
 *
 * 使用例：
 * ```tsx
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="モーダルタイトル"
 *   size="lg"
 *   showCloseButton
 * >
 *   <p>モーダルの内容</p>
 * </BaseModal>
 * ```
 */

import React from "react"
import { RxCross1 } from "react-icons/rx"

/**
 * モーダルサイズの型定義
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full"

/**
 * ベースモーダルコンポーネントのprops
 */
export interface BaseModalProps {
  /** モーダルが開いているかどうか */
  isOpen: boolean
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** モーダルが完全に閉じた後のコールバック（アニメーション完了後に実行） */
  onClosed?: () => void
  /** モーダルのタイトル */
  title?: string
  /** モーダルの内容 */
  children: React.ReactNode
  /** フッター部分の内容 */
  footer?: React.ReactNode
  /** モーダルのサイズ */
  size?: ModalSize
  /** 閉じるボタンを表示するかどうか */
  showCloseButton?: boolean
  /** モーダルのID（一意である必要があります） */
  id?: string
  /** カスタムCSSクラス */
  className?: string
  /** クリックアウトサイドで閉じるかどうか */
  closeOnClickOutside?: boolean
  /** ESCキーで閉じるかどうか */
  closeOnEscape?: boolean
}

/**
 * モーダルサイズに対応するCSSクラスのマッピング
 */
const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full"
}

/**
 * ベースモーダルコンポーネント
 *
 * アプリケーション内で使用されるモーダルの基本構造を提供します。
 *
 * @param props コンポーネントのprops
 * @returns ベースモーダル要素
 */
export function BaseModal({
  isOpen,
  onClose,
  onClosed,
  title,
  children,
  footer,
  size = "lg",
  showCloseButton = true,
  id = "base-modal",
  className = "",
  closeOnClickOutside = true,
  closeOnEscape = true
}: BaseModalProps): React.JSX.Element {
  // ESCキーでの閉じる処理
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // モーダルが閉じられた後の処理
  React.useEffect(() => {
    if (!isOpen && onClosed) {
      // DaisyUIのアニメーション時間を考慮してコールバックを実行
      const timer = setTimeout(() => {
        onClosed()
      }, 300)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen, onClosed])

  // モーダル外クリック時の処理
  const handleBackdropClick = (event: React.MouseEvent): void => {
    if (closeOnClickOutside && event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <input type="checkbox" id={id} className="modal-toggle" checked={isOpen} readOnly />
      <div className="modal cursor-pointer" onClick={handleBackdropClick}>
        <div
          className={`modal-box relative ${sizeClasses[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー部分 */}
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{title}</h3>
              {showCloseButton && (
                <button
                  className="btn btn-sm btn-circle absolute right-2 top-2"
                  onClick={onClose}
                  type="button"
                  aria-label="モーダルを閉じる"
                >
                  <RxCross1 />
                </button>
              )}
            </div>
          )}

          {/* 閉じるボタン（タイトルなしの場合） */}
          {!title && showCloseButton && (
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={onClose}
              type="button"
              aria-label="モーダルを閉じる"
            >
              <RxCross1 />
            </button>
          )}

          {/* メインコンテンツ */}
          <div className="modal-content">{children}</div>

          {/* フッター部分 */}
          {footer && <div className="modal-action">{footer}</div>}
        </div>
      </div>
    </>
  )
}

export default BaseModal
