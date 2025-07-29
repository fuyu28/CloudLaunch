/**
 * 章管理関連の型定義
 */

export type Chapter = {
  id: string
  name: string
  order: number
  gameId: string
  createdAt: Date
}

export type ChapterStats = {
  chapterId: string
  chapterName: string
  totalTime: number
  sessionCount: number
  averageTime: number
  order: number
}

export type ChapterCreateInput = {
  name: string
  gameId: string
}

export type ChapterUpdateInput = {
  name?: string
  order?: number
}

export type ChapterWithStats = Chapter & {
  totalTime: number
  sessionCount: number
  averageTime: number
}
