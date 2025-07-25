# 型システム運用ガイド

## 概要

このドキュメントは、CloudLaunchプロジェクトにおけるTypeScriptの型システムの運用方針とベストプラクティスを定義します。

## 基本方針

### 1. 型安全性の最優先

- `any`型の使用を禁止し、`unknown`型を使用する
- 可能な限り厳密な型定義を行う
- 型ガードを活用して実行時の型安全性を確保する

### 2. 共通型の統一管理

- すべての共通型は`src/types/`ディレクトリで管理
- ドメイン別に型定義ファイルを分割
- 型の再利用性を重視した設計

## 型定義ファイル構成

```
src/types/
├── common.ts           # 汎用的な共通型
├── result.d.ts         # API結果型
├── error.d.ts          # エラー関連型
├── validation.ts       # バリデーション関連型
├── game.d.ts          # ゲーム関連型
├── chapter.d.ts       # 章管理関連型
├── creds.d.ts         # 認証情報関連型
├── file.ts            # ファイル操作関連型
├── path.ts            # パス関連型
└── menu.d.ts          # メニュー関連型
```

## 型定義の詳細

### 1. ApiResult型（result.d.ts）

```typescript
export type ApiResult<T = void> = { success: true; data?: T } | { success: false; message: string }
```

**用途**: すべてのAPI通信の戻り値型として使用
**利点**: 成功・失敗の状態を型レベルで管理

### 2. 共通型（common.ts）

#### 非同期操作状態管理

```typescript
export interface AsyncState<T = unknown> {
  status: AsyncStatus
  data?: T
  error?: string
}

export type AsyncStatus = "idle" | "loading" | "success" | "error"
```

#### バリデーション型

```typescript
export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}

export interface LoadingState {
  isLoading: boolean
  error?: string
  lastUpdated?: Date
}
```

### 3. ドメイン固有型

#### ゲーム関連（game.d.ts）

```typescript
export type GameType = {
  id: string
  title: string
  publisher: string
  saveFolderPath?: string // undefined = オプショナル設定
  exePath: string
  imagePath?: string // undefined = オプショナル設定
  playStatus: PlayStatus
  totalPlayTime: number
  lastPlayed: Date | null // null = 明確な「未プレイ」状態
  clearedAt: Date | null // null = 明確な「未クリア」状態
  currentChapter: string | null // null = 明確な「未選択」状態
}
```

#### 章管理関連（chapter.d.ts）

```typescript
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
```

## 型運用ルール

### 1. null vs undefined の使い分け

#### nullを使用するケース

```typescript
// データベースのNULLに対応する場合
lastPlayed: Date | null
clearedAt: Date | null
currentChapter: string | null

// 明確に「値が存在しない」ことを表現する場合
parentId: string | null
```

#### undefinedを使用するケース

```typescript
// オプショナルプロパティ
interface GameForm {
  title: string
  imagePath?: string // 未設定でも問題ない
  saveFolderPath?: string // 未設定でも問題ない
}

// 関数の引数
function createGame(data: GameData, options?: CreateOptions) {}
```

### 2. ジェネリクス型の活用

#### 汎用的なコンテナ型

```typescript
export interface AsyncState<T = unknown> {
  status: AsyncStatus
  data?: T
  error?: string
}

// 使用例
const gameState: AsyncState<GameType[]> = {
  status: "loading",
  data: undefined,
  error: undefined
}
```

#### バリデーション関数型

```typescript
export type ValidationFunction<T = unknown> = (value: T) => ValidationResult

// 使用例
const validateGameTitle: ValidationFunction<string> = (title) => {
  if (!title.trim()) {
    return { isValid: false, message: "タイトルは必須です" }
  }
  return { isValid: true }
}
```

### 3. Union型の活用

#### 状態管理

```typescript
export type AsyncStatus = "idle" | "loading" | "success" | "error"
export type PlayStatus = "UNPLAYED" | "PLAYING" | "COMPLETED"
export type PathType = "exe" | "folder" | "image" | "any"
```

#### 判別可能なUnion型

```typescript
export type ApiResult<T = void> = { success: true; data?: T } | { success: false; message: string }
```

## エラーハンドリングの型パターン

### 1. try-catch文での型安全なエラーハンドリング

```typescript
try {
  const result = await someAsyncOperation()
  return { success: true, data: result }
} catch (error: unknown) {
  // unknownから適切な型に変換
  const err = error as NodeJS.ErrnoException

  return {
    success: false,
    message: err.message || "予期しないエラーが発生しました"
  }
}
```

### 2. 型ガードの活用

```typescript
function isApiError(error: unknown): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error
}

// 使用例
if (isApiError(error)) {
  console.error(error.message) // 型安全
}
```

## フロントエンド固有の型パターン

### 1. React Hooksの型定義

```typescript
export function useLoadingState(initialLoading = false): {
  isLoading: boolean
  error: string | undefined
  setLoading: (loading: boolean) => void
  setError: (error: string | undefined) => void
  reset: () => void
  executeWithLoading: <T>(
    asyncFn: () => Promise<T>,
    options?: ToastOptions
  ) => Promise<T | undefined>
}
```

### 2. Propsの型定義

```typescript
interface GameModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** 編集対象のゲーム（新規作成時はundefined） */
  game?: GameType
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** ゲームが追加・更新された際のコールバック */
  onGameSaved?: (game: GameType) => void
}
```

## バックエンド固有の型パターン

### 1. IPCハンドラーの型定義

```typescript
export const getGames = async (): Promise<ApiResult<GameType[]>> => {
  try {
    const games = await prisma.game.findMany()
    return { success: true, data: games }
  } catch (error) {
    logger.error("ゲーム取得エラー:", error)
    return { success: false, message: "ゲームの取得に失敗しました" }
  }
}
```

### 2. サービス層の型定義

```typescript
export interface MonitoredGame {
  gameId: string
  gameTitle: string
  exePath: string
  exeName: string
  lastDetected?: Date
  playStartTime?: Date
  accumulatedTime: number
  lastNotFound?: Date
}
```

## 型チェックとリンティング

### 1. TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true
  }
}
```

### 2. ESLint設定

```javascript
// eslint.config.mjs
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'warn',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error'
}
```

## 型の拡張とメンテナンス

### 1. 新しい型の追加手順

1. 適切な型定義ファイルを選択または新規作成
2. JSDocコメントで用途を明記
3. 既存の型との整合性を確認
4. `src/types/common.ts`で再エクスポートが必要か検討

### 2. 型の変更手順

1. 影響範囲を調査（IDE の Find References 機能を活用）
2. 段階的に型を更新
3. TypeScript コンパイラエラーを解消
4. テストの実行と修正

### 3. 型の削除手順

1. 使用箇所がないことを確認
2. deprecated コメントを追加（段階的削除の場合）
3. 関連するテストコードも削除

## ベストプラクティス

### 1. 型の命名規則

- Interface: `PascalCase` (例: `GameType`, `ChapterStats`)
- Type alias: `PascalCase` (例: `ApiResult`, `AsyncStatus`)
- Generic parameter: `T`, `K`, `V` など単文字、または `TData`, `TError` など

### 2. コメントの書き方

````typescript
/**
 * ゲーム情報の型定義
 *
 * @example
 * ```typescript
 * const game: GameType = {
 *   id: "uuid-123",
 *   title: "サンプルゲーム",
 *   publisher: "サンプル出版社",
 *   // ...
 * }
 * ```
 */
export interface GameType {
  /** ゲームの一意識別子 */
  id: string
  /** ゲームタイトル */
  title: string
  // ...
}
````

### 3. 型の依存関係管理

- 循環参照を避ける
- 基底となる型から派生型への一方向の依存関係を維持
- 共通型は`common.ts`に集約

## トラブルシューティング

### 1. よくある型エラーと解決方法

#### `Type 'unknown' is not assignable to type 'T'`

```typescript
// 悪い例
function process<T>(data: unknown): T {
  return data // エラー
}

// 良い例
function process<T>(data: unknown): T {
  return data as T // 型アサーション
}

// より良い例
function process<T>(data: unknown, validator: (data: unknown) => data is T): T | undefined {
  if (validator(data)) {
    return data // 型ガードで安全
  }
  return undefined
}
```

#### `Object is possibly 'null'`

```typescript
// 悪い例
function getName(user: User | null): string {
  return user.name // エラー
}

// 良い例
function getName(user: User | null): string {
  return user?.name ?? "Unknown"
}
```

### 2. パフォーマンス考慮事項

- 大きなUnion型は避ける
- 深い入れ子の型は避ける
- 必要に応じて型エイリアスで簡略化

## まとめ

型システムの適切な運用により、以下の利点が得られます：

1. **バグの早期発見**: コンパイル時に型エラーを検出
2. **開発効率の向上**: IDEの補完機能が充実
3. **リファクタリングの安全性**: 型による影響範囲の特定
4. **コードの自己文書化**: 型定義がドキュメントの役割
5. **チーム開発の品質向上**: 型による契約の明確化

このガイドラインに従い、一貫性のある型システムを維持してください。
