# GameSync コーディングガイドライン

このドキュメントは、GameSyncプロジェクトにおけるコーディング規約とベストプラクティスを定義します。

## 目次

- [ファイル構成・命名規約](#ファイル構成命名規約)
- [コメント・ドキュメント規約](#コメントドキュメント規約)
- [TypeScript コーディング規約](#typescript-コーディング規約)
- [React コンポーネント規約](#react-コンポーネント規約)
- [エラーハンドリング規約](#エラーハンドリング規約)
- [IPC通信規約](#ipc通信規約)
- [セキュリティガイドライン](#セキュリティガイドライン)

## ファイル構成・命名規約

### ディレクトリ構造

```
src/
├── constants/         # 定数管理（NEW）
│   ├── messages.ts    # UI・エラーメッセージ統一管理
│   ├── config.ts      # 設定値・デフォルト値の定数化
│   ├── patterns.ts    # 正規表現パターンの共通化
│   └── index.ts       # 統一エクスポート
├── utils/             # 共通ユーティリティ（NEW）
│   ├── stringUtils.ts # 文字列操作・サニタイズ関数
│   ├── validationUtils.ts # バリデーション関数の統一
│   ├── pathUtils.ts   # パス操作・ファイル処理関数
│   └── index.ts       # 統一エクスポート
├── types/             # 共有型定義（EXPANDED）
│   ├── validation.ts  # バリデーション関連型の統一
│   ├── path.ts        # パス関連型の整理
│   ├── common.ts      # 共通型のエクスポート
│   ├── result.ts      # API結果型
│   ├── error.ts       # エラー型
│   └── ...
├── main/              # Electron メインプロセス
│   ├── ipcHandlers/   # IPC通信ハンドラー
│   ├── service/       # ビジネスロジックサービス
│   └── utils/         # ユーティリティ関数
├── preload/           # セキュリティブリッジ
│   └── api/           # レンダラー向けAPI定義
└── renderer/          # React フロントエンド
    ├── components/    # 再利用可能コンポーネント
    ├── pages/         # ページコンポーネント
    ├── state/         # Jotai 状態管理
    ├── hooks/         # カスタムフック（EXPANDED）
    │   ├── useGameActions.ts  # ゲーム操作ロジック
    │   ├── useToastHandler.ts # トースト処理
    │   └── ...
    └── utils/         # フロントエンドユーティリティ
```

### ファイル命名規約

- **TypeScript/JavaScript**: camelCase (`gameService.ts`)
- **React コンポーネント**: PascalCase (`GameModal.tsx`)
- **型定義ファイル**: camelCase (`creds.ts`, `game.ts`)
- **定数ファイル**: UPPER_SNAKE_CASE または camelCase
- **ユーティリティ**: camelCase (`fileUtils.ts`)

### 変数・関数命名規約

- **変数名**: camelCase (`gameData`, `localPath`, `remotePath`)
- **関数名**: camelCase、動詞から始める (`getCredential`, `validatePath`)
- **定数**: UPPER_SNAKE_CASE (`API_TIMEOUT`, `MAX_RETRY_COUNT`)
- **型・インターフェース**: PascalCase (`GameData`, `ApiResult`)
- **列挙型**: PascalCase (`PathType`, `PlayStatus`)

## コメント・ドキュメント規約

### ファイルレベルコメント

すべての重要なファイルにはファイルの先頭に `@fileoverview` コメントを記述：

```typescript
/**
 * @fileoverview ゲーム管理に関するIPC通信ハンドラー
 *
 * このファイルは、フロントエンドからのゲーム操作リクエストを処理します。
 * - ゲーム一覧の取得（検索・フィルタ・ソート機能付き）
 * - ゲーム詳細情報の取得
 * - ゲームの作成・更新・削除
 *
 * すべての操作はPrismaを通してSQLiteデータベースに対して実行されます。
 */
```

### 関数コメント

複雑な関数には詳細なJSDocコメントを記述：

```typescript
/**
 * ファイル・ディレクトリの存在確認と形式検証を行う
 *
 * この関数は、指定されたパスが存在するかどうかを確認し、
 * オプションで期待する形式（ファイル種別）と一致するかを検証します。
 *
 * @param filePath 検証するパス（絶対パス推奨）
 * @param expectType 期待するファイル形式
 * @returns ValidatePathResult 検証結果
 */
export async function validatePathWithType(
  filePath: string,
  expectType?: PathType | string
): Promise<ValidatePathResult>
```

### インラインコメント

- 複雑なロジックには説明コメントを追加
- WHYを説明する（WHATではなく）
- 日本語で記述（プロジェクトが日本語ベースのため）

## TypeScript コーディング規約

### 型安全性

- `any` の使用は極力避ける（必要な場合は `// eslint-disable-next-line` で一時的に許可）
- 外部API応答には適切な型ガードを実装
- union型を活用して状態を型安全に管理
- 共通型定義は `src/types/` ディレクトリを活用

```typescript
// Good
type ApiResult<T = void> =
  | { success: true; data: T }
  | { success: false; message: string }

// Bad
function handleResponse(response: any) { ... }
```

### null vs undefined の使い分け

プロジェクトで一貫した null/undefined の使い分けを行います：

#### 基本原則

- **null**: 明確な空の状態を表現（意図的に空、選択されていない、値が存在しない）
- **undefined**: オプショナルな状態を表現（設定されていない、初期化されていない、パラメータが省略された）

#### 具体的な使用例

```typescript
// Good: 適切な使い分け
interface GameType {
  id: string
  title: string
  lastPlayed: Date | null // null - 明確な「未プレイ」状態
  currentChapter: string | null // null - 明確な「未選択」状態
  imagePath?: string // undefined - オプショナル設定
  saveFolderPath?: string // undefined - オプショナル設定
}

interface PlaySessionType {
  id: string
  sessionName?: string // undefined - オプショナル情報
  chapterId: string | null // null - 明確な「未所属」状態
  chapter?: {
    // undefined - オプショナル情報
    name: string
    id: string
  }
}

// Bad: 使い分けが不適切
interface BadExample {
  lastPlayed: Date | undefined // 明確な状態なのでnullが適切
  imagePath: string | null // オプショナルなのでundefinedが適切
}
```

#### データ変換層での処理

Prismaのnullとフロントエンドのundefinedを適切に変換：

```typescript
// データ変換関数の例
export function transformGame(game: Game): GameType {
  return {
    ...game,
    // オプショナル設定のみundefinedに変換
    imagePath: nullToUndefined(game.imagePath),
    saveFolderPath: nullToUndefined(game.saveFolderPath),
    // 明確な状態はnullのまま維持
    lastPlayed: game.lastPlayed,
    currentChapter: game.currentChapter
  }
}
```

#### API設計での考慮事項

```typescript
// 適切なAPI設計
interface DatabaseAPI {
  updateSessionChapter(sessionId: string, chapterId: string | null): Promise<ApiResult<void>>
  createSession(duration: number, gameId: string, sessionName?: string): Promise<ApiResult<void>>
}

// フィールドの説明
// chapterId: string | null     - 章の「未選択」状態を表現
// sessionName?: string         - セッション名は省略可能（オプショナル）
```

### 定数・メッセージの管理

- ハードコーディングされた文字列・数値は `src/constants/` の定数を使用
- マジック文字列・数値の撲滅

```typescript
// Good
import { MESSAGES, CONFIG } from "../constants"
toast.loading(MESSAGES.GAME.ADDING)
setTimeout(callback, CONFIG.TIMING.SEARCH_DEBOUNCE_MS)

// Bad
toast.loading("ゲームを追加しています...")
setTimeout(callback, 300)
```

### ユーティリティ関数の活用

- 共通的な処理は `src/utils/` のユーティリティ関数を使用
- 重複コードの削除

```typescript
// Good
import { sanitizeGameTitle, validateRequired } from "../utils"
const sanitized = sanitizeGameTitle(gameTitle)
const validation = validateRequired(title, "タイトル")

// Bad
const sanitized = gameTitle.replace(/[<>:"/\\|?*]/g, "_")
if (!title || title.trim() === "") {
  return "タイトルは必須です"
}
```

### エラーハンドリング

- エラー変数名は `error` に統一（`err` ではなく）
- 具体的なエラー型を使用
- `src/utils/errorHandler.ts` の統一エラーハンドラーを活用
- エラーメッセージは `MESSAGES` 定数を使用

```typescript
import { MESSAGES } from "../constants"
import { handleApiError } from "../utils/errorHandler"

try {
  // 処理
  const result = await window.api.database.createGame(data)
  if (!result.success) {
    handleApiError(result, MESSAGES.GAME.ADD_FAILED)
    return
  }
} catch (error) {
  console.error(error)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma固有のエラー処理
  }
  return { success: false, message: MESSAGES.GAME.ADD_FAILED }
}
```

## React コンポーネント規約

### コンポーネント構造

```typescript
/**
 * @fileoverview コンポーネントの説明
 */

import React, { useState, useEffect } from "react"
import { MESSAGES } from '../constants'  // 定数の活用
import { useGameActions, useToastHandler } from '../hooks'  // カスタムフックの活用

type ComponentProps = {
  // props定義
}

export default function ComponentName({ props }: ComponentProps) {
  // 1. Custom Hooks（カスタムフックを優先使用）
  const gameActions = useGameActions()
  const toastHandler = useToastHandler()

  // 2. State
  const [state, setState] = useState()

  // 3. Effects
  useEffect(() => {
    // 副作用
  }, [])

  // 4. Event handlers
  const handleEvent = () => {
    // ハンドラー
  }

  // 5. Render
  return (
    // JSX
  )
}
```

### カスタムフック活用規約

- **複雑なロジック**は専用カスタムフックに分離
- **責務の明確化**：1つのフックは1つの責務
- **再利用性**：複数コンポーネントで使用される処理はフック化

#### 推奨カスタムフック

- `useGameActions`: ゲーム操作ロジック
- `useToastHandler`: トースト処理
- `useLoadingState`: ローディング状態管理

### Hooks 使用規約

- `useState`: 状態管理
- `useEffect`: 副作用（API呼び出し、イベントリスナー）
- `useCallback`: 関数のメモ化（依存配列を適切に設定）
- `useMemo`: 値のメモ化（重い計算の最適化）

### 責務分離原則

- **単一責任**：コンポーネントは1つの責務のみ
- **50行制限**：コンポーネント本体は50行以下を目標
- **カスタムフック分離**：複雑な処理は専用フックに移動

## エラーハンドリング規約

### API結果の統一形式

```typescript
type ApiResult<T = void> = { success: true; data: T } | { success: false; message: string }
```

### エラーメッセージ

- **必ず `MESSAGES` 定数を使用**
- 日本語で記述
- ユーザーが理解できる内容
- 可能な場合は解決方法を含める

```typescript
// Good
import { MESSAGES } from "../constants"
return { success: false, message: MESSAGES.AUTH.CREDENTIAL_NOT_FOUND }

// Bad
return { success: false, message: "認証情報が見つかりません" }
```

### メッセージ定数の管理

- 新しいメッセージは `src/constants/messages.ts` に追加
- カテゴリ別に整理（GAME, AUTH, SAVE_DATA, etc.）
- 一貫性のあるトーン・敬語レベルを維持

## IPC通信規約

### ハンドラー命名規約

- 動詞-名詞の形式: `get-game`, `create-session`, `upload-save-data`
- ケバブケース使用
- 明確で説明的な名前

### ハンドラー実装規約

```typescript
export function registerHandlers(): void {
  ipcMain.handle("handler-name", async (_event, params): Promise<ApiResult> => {
    try {
      // メイン処理
      return { success: true }
    } catch (error) {
      console.error(error)
      return { success: false, message: "エラーメッセージ" }
    }
  })
}
```

## セキュリティガイドライン

### 認証情報管理

- 秘密鍵は必ずkeytar（OSキーチェーン）に保存
- 設定ファイルには機密情報を平文で保存しない
- アクセスキーIDなどの低機密情報のみelectron-storeに保存

### ファイルアクセス

- ユーザー選択ファイル以外への不正アクセスを防止
- パストラバーサル攻撃の対策
- 適切な権限チェック

### IPC通信

- プリロードスクリプトで安全なAPI公開
- レンダラープロセスに直接Node.js APIを公開しない
- 入力値の適切なバリデーション

## コードレビューチェックリスト

### 基本チェック

- [ ] ファイルレベルコメントが記述されている
- [ ] 複雑な関数にJSDocコメントがある
- [ ] 適切なエラーハンドリングが実装されている
- [ ] セキュリティ考慮事項が適切に対応されている
- [ ] 命名規約に従っている
- [ ] 型安全性が保たれている
- [ ] テスト可能な構造になっている

### リファクタリング成果活用チェック

- [ ] **定数使用**: ハードコーディングされた文字列・数値が `src/constants/` の定数に置き換えられている
- [ ] **ユーティリティ活用**: 重複する処理が `src/utils/` のユーティリティ関数を使用している
- [ ] **型定義統一**: 適切な型が `src/types/` から使用されている
- [ ] **責務分離**: コンポーネントが50行以下で単一責任を守っている
- [ ] **カスタムフック**: 複雑なロジックが専用フックに分離されている
- [ ] **エラーハンドリング**: 統一されたエラーハンドラーとメッセージ定数を使用している
- [ ] **null/undefined使い分け**: 意味論的に適切なnull/undefinedの使い分けが行われている

### 品質保証チェック

- [ ] `npm run typecheck` でエラーなし
- [ ] `npm run lint` で警告なし
- [ ] `npm run format` で整形済み
- [ ] `npm run test` で関連テストが通過

## 推奨ツール・設定

### VS Code 拡張機能

- TypeScript Hero
- Prettier
- ESLint
- Prisma

### 設定ファイル

プロジェクトルートの設定ファイルに従ってください：

- `.eslintrc.js`
- `.prettierrc`
- `tsconfig.json`

このガイドラインに従うことで、保守しやすく安全なコードを維持できます。
