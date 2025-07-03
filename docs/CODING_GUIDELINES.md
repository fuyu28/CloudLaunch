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
├── main/              # Electron メインプロセス
│   ├── ipcHandlers/   # IPC通信ハンドラー
│   ├── service/       # ビジネスロジックサービス
│   └── utils/         # ユーティリティ関数
├── preload/           # セキュリティブリッジ
│   └── api/           # レンダラー向けAPI定義
├── renderer/          # React フロントエンド
│   ├── components/    # 再利用可能コンポーネント
│   ├── pages/         # ページコンポーネント
│   ├── state/         # Jotai 状態管理
│   └── utils/         # フロントエンドユーティリティ
└── types/             # 共有型定義
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

- `any` の使用は最小限に抑制
- 外部API応答には適切な型ガードを実装
- union型を活用して状態を型安全に管理

```typescript
// Good
type ApiResult<T = void> =
  | { success: true; data: T }
  | { success: false; message: string }

// Bad
function handleResponse(response: any) { ... }
```

### エラーハンドリング

- エラー変数名は `error` に統一（`err` ではなく）
- 具体的なエラー型を使用
- ユーザーフレンドリーなエラーメッセージを提供

```typescript
try {
  // 処理
} catch (error) {
  console.error(error)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma固有のエラー処理
  }
  return { success: false, message: "ユーザー向けメッセージ" }
}
```

## React コンポーネント規約

### コンポーネント構造

```typescript
/**
 * @fileoverview コンポーネントの説明
 */

import React, { useState, useEffect } from "react"

type ComponentProps = {
  // props定義
}

export default function ComponentName({ props }: ComponentProps) {
  // 1. State
  const [state, setState] = useState()

  // 2. Effects
  useEffect(() => {
    // 副作用
  }, [])

  // 3. Event handlers
  const handleEvent = () => {
    // ハンドラー
  }

  // 4. Render
  return (
    // JSX
  )
}
```

### Hooks 使用規約

- `useState`: 状態管理
- `useEffect`: 副作用（API呼び出し、イベントリスナー）
- `useCallback`: 関数のメモ化（依存配列を適切に設定）
- `useMemo`: 値のメモ化（重い計算の最適化）

## エラーハンドリング規約

### API結果の統一形式

```typescript
type ApiResult<T = void> = { success: true; data: T } | { success: false; message: string }
```

### エラーメッセージ

- 日本語で記述
- ユーザーが理解できる内容
- 可能な場合は解決方法を含める

```typescript
// Good
"認証情報が見つかりません。設定画面で認証情報を設定してください。"

// Bad
"Credential not found"
```

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

- [ ] ファイルレベルコメントが記述されている
- [ ] 複雑な関数にJSDocコメントがある
- [ ] 適切なエラーハンドリングが実装されている
- [ ] セキュリティ考慮事項が適切に対応されている
- [ ] 命名規約に従っている
- [ ] 型安全性が保たれている
- [ ] テスト可能な構造になっている

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
