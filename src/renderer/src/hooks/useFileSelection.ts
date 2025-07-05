/**
 * @fileoverview ファイル選択フックユーティリティ
 *
 * このファイルは、ファイル・フォルダ選択の共通ロジックを提供します。
 * 主な機能：
 * - ファイル選択のローディング状態管理
 * - エラーハンドリングの統一
 * - ファイル選択ロジックの再利用
 */

/// <reference types="../../../preload/index.d.ts" />

import { useState, useCallback } from "react"
import { handleApiError } from "../utils/errorHandler"

type FileFilter = {
  name: string
  extensions: string[]
}

/**
 * ファイル選択フック
 * @returns ファイル選択に関するstate, handler
 */
export function useFileSelection(): {
  isBrowsing: boolean
  selectFile: (filters: FileFilter[], onSuccess: (filePath: string) => void) => Promise<void>
  selectFolder: (onSuccess: (folderPath: string) => void) => Promise<void>
} {
  const [isBrowsing, setIsBrowsing] = useState(false)

  const selectFile = useCallback(
    async (filters: FileFilter[], onSuccess: (filePath: string) => void) => {
      setIsBrowsing(true)
      try {
        const result = await window.api.file.selectFile(filters)
        if (result.success && result.data !== null && result.data !== undefined) {
          onSuccess(result.data)
        } else {
          handleApiError(
            {
              success: false,
              message: result.success
                ? "ファイルが選択されませんでした"
                : (result as { success: false; message: string }).message
            },
            "ファイルの選択に失敗しました"
          )
        }
      } finally {
        setIsBrowsing(false)
      }
    },
    []
  )

  const selectFolder = useCallback(async (onSuccess: (folderPath: string) => void) => {
    setIsBrowsing(true)
    try {
      const result = await window.api.file.selectFolder()
      if (result.success && result.data !== null && result.data !== undefined) {
        onSuccess(result.data)
      } else {
        handleApiError(
          {
            success: false,
            message: result.success
              ? "フォルダが選択されませんでした"
              : (result as { success: false; message: string }).message
          },
          "フォルダの選択に失敗しました"
        )
      }
    } finally {
      setIsBrowsing(false)
    }
  }, [])

  return {
    isBrowsing,
    selectFile,
    selectFolder
  }
}
