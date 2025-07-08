/**
 * 章管理関連の型定義
 */

export interface Chapter {
  id: string
  name: string
  order: number
  gameId: string
  createdAt: Date
}

export interface ChapterStats {
  chapterId: string
  chapterName: string
  totalTime: number
  sessionCount: number
  averageTime: number
  order: number
}

export interface ChapterCreateInput {
  name: string
  gameId: string
}

export interface ChapterUpdateInput {
  name?: string
  order?: number
}

export interface ChapterWithStats extends Chapter {
  totalTime: number
  sessionCount: number
  averageTime: number
}
