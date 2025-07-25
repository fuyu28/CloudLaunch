/**
 * @fileoverview クラウドデータ変換ユーティリティ
 *
 * このファイルは、S3オブジェクトデータをアプリケーション用の
 * データ構造に変換する機能を提供します。
 *
 * 主な機能：
 * - オブジェクトのフォルダごとのグループ化
 * - ディレクトリツリー構築
 * - CloudDataItem変換
 * - ファイル詳細情報変換
 */

import type { S3ObjectMetadata } from "../service/cloudStorageService"

/**
 * 汎用エラークラス
 */
export class CloudDataTransformError extends Error {
  constructor(
    message: string,
    public readonly operation: string
  ) {
    super(message)
    this.name = "CloudDataTransformError"
  }
}

/**
 * クラウドデータアイテムの型定義
 */
export interface CloudDataItem {
  /** ゲーム名/フォルダ名 */
  name: string
  /** 総ファイルサイズ（バイト） */
  totalSize: number
  /** ファイル数 */
  fileCount: number
  /** 最終更新日時 */
  lastModified: Date
  /** リモートパス（削除時に使用） */
  remotePath: string
}

/**
 * クラウドファイル詳細情報の型定義
 */
export interface CloudFileDetail {
  /** ファイル名 */
  name: string
  /** ファイルサイズ（バイト） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** S3オブジェクトキー */
  key: string
  /** 相対パス */
  relativePath: string
}

/**
 * ディレクトリツリーノードの型定義
 */
export interface CloudDirectoryNode {
  /** ノード名 */
  name: string
  /** フルパス */
  path: string
  /** ディレクトリかどうか */
  isDirectory: boolean
  /** ファイルサイズ（ディレクトリの場合は配下の総サイズ） */
  size: number
  /** 最終更新日時 */
  lastModified: Date
  /** 子ノード */
  children?: CloudDirectoryNode[]
  /** S3オブジェクトキー（ファイルの場合） */
  objectKey?: string
}

/**
 * フォルダごとにオブジェクトをグループ化
 *
 * @param objects オブジェクト一覧
 * @returns フォルダ名をキーとしたオブジェクトのマップ
 */
export function groupObjectsByFolder(objects: S3ObjectMetadata[]): Map<string, S3ObjectMetadata[]> {
  const folderMap = new Map<string, S3ObjectMetadata[]>()

  objects.forEach((obj) => {
    // ルートレベルのフォルダ名を取得
    const folderName = obj.key.split("/")[0]
    if (!folderName) return

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, [])
    }
    folderMap.get(folderName)!.push(obj)
  })

  return folderMap
}

/**
 * フォルダマップからCloudDataItemの配列を作成
 *
 * @param folderMap フォルダごとにグループ化されたオブジェクト
 * @returns CloudDataItemの配列（最終更新日時で降順ソート済み）
 */
export function createCloudDataItems(folderMap: Map<string, S3ObjectMetadata[]>): CloudDataItem[] {
  const cloudDataItems: CloudDataItem[] = []

  for (const [folderName, objects] of folderMap.entries()) {
    // フォルダ内の総サイズを計算
    const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0)

    // 最新の更新日時を取得
    const lastModified = new Date(Math.max(...objects.map((obj) => obj.lastModified.getTime())))

    cloudDataItems.push({
      name: folderName,
      totalSize,
      fileCount: objects.length,
      lastModified,
      remotePath: folderName
    })
  }

  // 最終更新日時で降順ソート
  cloudDataItems.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

  return cloudDataItems
}

/**
 * オブジェクト一覧からディレクトリツリーを構築
 *
 * @param objects オブジェクト一覧
 * @returns ディレクトリツリー（ルートレベルのノードの配列）
 */
export function buildDirectoryTree(objects: S3ObjectMetadata[]): CloudDirectoryNode[] {
  const tree: Map<string, CloudDirectoryNode> = new Map()

  objects.forEach((obj) => {
    const pathParts = obj.key.split("/")
    let currentPath = ""

    pathParts.forEach((part, index) => {
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = index === pathParts.length - 1

      if (!tree.has(currentPath)) {
        const node: CloudDirectoryNode = {
          name: part,
          path: currentPath,
          isDirectory: !isFile,
          size: isFile ? obj.size : 0,
          lastModified: obj.lastModified,
          children: isFile ? undefined : [],
          objectKey: isFile ? obj.key : undefined
        }
        tree.set(currentPath, node)

        // 親ディレクトリに追加
        if (parentPath && tree.has(parentPath)) {
          const parent = tree.get(parentPath)!
          if (parent.children) {
            parent.children.push(node)
          }
        }
      } else {
        // 既存ノードの更新（ディレクトリの場合）
        const existingNode = tree.get(currentPath)!
        if (!isFile) {
          // ディレクトリサイズは後で計算
          existingNode.lastModified = new Date(
            Math.max(existingNode.lastModified.getTime(), obj.lastModified.getTime())
          )
        }
      }
    })
  })

  // ディレクトリサイズを再帰的に計算
  const calculateDirectorySize = (node: CloudDirectoryNode): number => {
    if (!node.isDirectory) {
      return node.size
    }

    node.size = (node.children ?? []).reduce(
      (total, child) => total + calculateDirectorySize(child),
      0
    )
    return node.size
  }

  // ルートレベルのノードを取得
  const rootNodes: CloudDirectoryNode[] = []
  tree.forEach((node) => {
    if (!node.path.includes("/")) {
      calculateDirectorySize(node)
      rootNodes.push(node)
    }
  })

  // 子ノードを再帰的にソート
  const sortNodes = (nodes: CloudDirectoryNode[]): void => {
    nodes.sort((a, b) => {
      // ディレクトリを先に、その後ファイル名でソート
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children)
      }
    })
  }

  sortNodes(rootNodes)
  return rootNodes
}

/**
 * オブジェクト一覧からファイル詳細情報を作成
 *
 * @param objects オブジェクト一覧
 * @param remotePath ベースリモートパス
 * @returns ファイル詳細情報の配列（ファイル名でソート済み）
 */
export function createFileDetails(
  objects: S3ObjectMetadata[],
  remotePath: string
): CloudFileDetail[] {
  const fileDetails: CloudFileDetail[] = objects.map((obj) => {
    // ファイル名とrelativePathを取得
    const pathParts = obj.key.split("/")
    const fileName = pathParts[pathParts.length - 1]
    const relativePath = obj.key.substring(remotePath.length + 1)

    return {
      name: fileName,
      size: obj.size,
      lastModified: obj.lastModified,
      key: obj.key,
      relativePath
    }
  })

  // ファイル名でソート
  fileDetails.sort((a, b) => a.name.localeCompare(b.name))

  return fileDetails
}
