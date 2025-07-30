/**
 * @fileoverview バッチ処理ユーティリティ
 *
 * このモジュールは、配列要素を指定されたバッチサイズで並列処理する
 * 共通のユーティリティ関数を提供します。
 *
 * 主な機能：
 * - 配列のバッチ分割
 * - 並列バッチ処理の実行
 * - エラーハンドリングとログ出力
 * - 進捗報告機能
 */

import { logger } from "./logger"
import { BATCH_SIZES } from "../constants/processing"

/**
 * 配列要素をバッチ処理で並列実行する
 *
 * @param items 処理対象の配列
 * @param processor 各アイテムを処理する関数
 * @param batchSize バッチサイズ（デフォルト: BATCH_SIZES.UPLOAD_DOWNLOAD）
 * @param logContext ログ出力時のコンテキスト名
 * @returns Promise<R[]> 処理結果の配列
 *
 * @example
 * ```typescript
 * const results = await processBatch(
 *   filePaths,
 *   async (filePath) => uploadFile(filePath),
 *   BATCH_SIZES.UPLOAD_DOWNLOAD,
 *   "ファイルアップロード"
 * )
 * ```
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = BATCH_SIZES.UPLOAD_DOWNLOAD,
  logContext?: string
): Promise<R[]> {
  const results: R[] = []
  const totalItems = items.length

  if (totalItems === 0) {
    return results
  }

  const contextMsg = logContext ? `${logContext}: ` : ""
  logger.info(`${contextMsg}バッチ処理開始 (総数: ${totalItems}, バッチサイズ: ${batchSize})`)

  for (let i = 0; i < totalItems; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(totalItems / batchSize)

    logger.info(`${contextMsg}バッチ ${batchNumber}/${totalBatches} 処理中 (${batch.length}個)`)

    try {
      // バッチ内の全アイテムを並列処理
      const batchResults = await Promise.all(
        batch.map(async (item, index) => {
          try {
            return await processor(item)
          } catch (error) {
            logger.error(
              `${contextMsg}バッチ ${batchNumber} のアイテム ${index + 1} でエラー:`,
              error
            )
            throw error
          }
        })
      )

      results.push(...batchResults)
      logger.info(`${contextMsg}バッチ ${batchNumber}/${totalBatches} 完了`)
    } catch (error) {
      logger.error(`${contextMsg}バッチ ${batchNumber} の処理中にエラー:`, error)
      throw error
    }
  }

  logger.info(`${contextMsg}バッチ処理完了 (処理済み: ${results.length}/${totalItems})`)
  return results
}

/**
 * バッチ処理で要素をフィルタリングする
 *
 * @param items 処理対象の配列
 * @param predicate 各アイテムをチェックする述語関数
 * @param batchSize バッチサイズ
 * @param logContext ログ出力時のコンテキスト名
 * @returns Promise<T[]> フィルタリング結果の配列
 */
export async function filterBatch<T>(
  items: T[],
  predicate: (item: T) => Promise<boolean>,
  batchSize: number = BATCH_SIZES.FILE_DETAILS,
  logContext?: string
): Promise<T[]> {
  const results: T[] = []

  await processBatch(
    items,
    async (item) => {
      const shouldInclude = await predicate(item)
      if (shouldInclude) {
        results.push(item)
      }
      return shouldInclude
    },
    batchSize,
    logContext
  )

  return results
}

/**
 * バッチ処理で配列を変換する
 *
 * @param items 処理対象の配列
 * @param mapper 各アイテムを変換する関数
 * @param batchSize バッチサイズ
 * @param logContext ログ出力時のコンテキスト名
 * @returns Promise<R[]> 変換結果の配列
 */
export async function mapBatch<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  batchSize: number = BATCH_SIZES.UPLOAD_DOWNLOAD,
  logContext?: string
): Promise<R[]> {
  return processBatch(items, mapper, batchSize, logContext)
}

/**
 * バッチ処理でvoid操作を実行する
 *
 * @param items 処理対象の配列
 * @param operation 各アイテムに対する操作
 * @param batchSize バッチサイズ
 * @param logContext ログ出力時のコンテキスト名
 * @returns Promise<void>
 */
export async function forEachBatch<T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  batchSize: number = BATCH_SIZES.UPLOAD_DOWNLOAD,
  logContext?: string
): Promise<void> {
  await processBatch(
    items,
    async (item) => {
      await operation(item)
      return undefined
    },
    batchSize,
    logContext
  )
}
