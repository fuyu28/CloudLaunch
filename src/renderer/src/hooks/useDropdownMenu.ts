/**
 * @fileoverview ドロップダウンメニュー制御フック
 *
 * 複数のメモ関連コンポーネントで使用されるドロップダウンメニューの
 * 開閉状態管理と外部クリック検知を提供します。
 */

import { useEffect, useState } from "react"

type UseDropdownMenuReturn = {
  openDropdownId: string | null
  toggleDropdown: (id: string, event: React.MouseEvent) => void
  closeDropdown: () => void
  isOpen: (id: string) => boolean
}

/**
 * ドロップダウンメニューの制御フック
 *
 * @returns ドロップダウンメニュー制御用の状態と関数
 */
export function useDropdownMenu(): UseDropdownMenuReturn {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // ドロップダウンメニューを閉じるためのクリックイベント
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element
      if (target && !target.closest(".dropdown")) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside)
      }, 0)
      return (): void => {
        document.removeEventListener("click", handleClickOutside)
      }
    }

    return undefined
  }, [openDropdownId])

  // ドロップダウンの開閉
  const toggleDropdown = (id: string, event: React.MouseEvent): void => {
    event.stopPropagation()
    setOpenDropdownId(openDropdownId === id ? null : id)
  }

  // ドロップダウンを閉じる
  const closeDropdown = (): void => {
    setOpenDropdownId(null)
  }

  // 指定されたIDのドロップダウンが開いているかチェック
  const isOpen = (id: string): boolean => {
    return openDropdownId === id
  }

  return {
    openDropdownId,
    toggleDropdown,
    closeDropdown,
    isOpen
  }
}
