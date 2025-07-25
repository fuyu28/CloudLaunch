# CloudLaunch 開発ワークフローガイド

## どこに何を書けばいいか - 機能別ガイド

### 新機能開発の流れ（リファクタリング後）

1. **要件定義** → 機能仕様をCLAUDE.mdまたはissueに記録
2. **定数定義** → `src/constants/` にメッセージ・設定値を定義
3. **型定義** → `src/types/` に型を定義
4. **ユーティリティ** → `src/utils/` に共通処理を実装
5. **バックエンド実装** → メインプロセスで処理ロジック実装
6. **IPC通信** → プリロードAPIとハンドラーを実装
7. **カスタムフック** → `src/renderer/src/hooks/` に再利用ロジック実装
8. **フロントエンド** → React コンポーネントで UI 実装
9. **テスト** → 機能テストと統合テスト
10. **品質確保** → typecheck, lint, format, build実行
11. **ドキュメント更新** → CLAUDE.md、README更新

## ファイル配置ガイド（リファクタリング後アーキテクチャ）

> システム全体のアーキテクチャは [SYSTEM_SPECIFICATION.md](./SYSTEM_SPECIFICATION.md) を参照してください。

### 定数・ユーティリティ・型定義

| 実装内容           | ファイル配置                   | 説明                       | 使用例                          |
| ------------------ | ------------------------------ | -------------------------- | ------------------------------- |
| UIメッセージ       | `src/constants/messages.ts`    | エラー・成功メッセージ統一 | `MESSAGES.GAME.ADDING`          |
| 設定値・制限値     | `src/constants/config.ts`      | タイムアウト・制限値定数   | `CONFIG.TIMING.SEARCH_DEBOUNCE` |
| 正規表現パターン   | `src/constants/patterns.ts`    | バリデーション用パターン   | `PATTERNS.INVALID_FILENAME`     |
| 文字列操作         | `src/utils/stringUtils.ts`     | サニタイズ・フォーマット   | `sanitizeGameTitle(title)`      |
| バリデーション     | `src/utils/validationUtils.ts` | 入力値検証・エラー判定     | `validateRequired(value)`       |
| パス操作           | `src/utils/pathUtils.ts`       | ファイルパス・URL処理      | `createRemotePath(title)`       |
| バリデーション型   | `src/types/validation.ts`      | バリデーション結果型       | `ValidationResult`              |
| パス関連型         | `src/types/path.ts`            | パス・ファイル関連型       | `PathInfo`                      |
| 共通型エクスポート | `src/types/common.ts`          | 汎用型の統一アクセス       | `SelectOption<T>`               |

### データベース関連の実装

| 実装内容         | ファイル配置                               | 説明                     |
| ---------------- | ------------------------------------------ | ------------------------ |
| モデル定義       | `prisma/schema.prisma`                     | データベーススキーマ定義 |
| マイグレーション | `prisma/migrations/`                       | スキーマ変更履歴         |
| シードデータ     | `prisma/seed.ts`                           | 初期データ・テストデータ |
| DB操作           | `src/main/ipcHandlers/databaseHandlers.ts` | CRUD操作のIPC実装        |
| DB接続           | `src/main/db.ts`                           | Prismaクライアント設定   |

### 認証・設定管理

| 実装内容     | ファイル配置                                 | 説明                    |
| ------------ | -------------------------------------------- | ----------------------- |
| 認証情報管理 | `src/main/service/credentialService.ts`      | keytar + electron-store |
| 認証IPC      | `src/main/ipcHandlers/credentialHandlers.ts` | 認証情報のCRUD          |
| 型定義       | `src/types/creds.ts`                         | 認証情報の型定義        |
| 設定UI       | `src/renderer/src/pages/Settings.tsx`        | 設定画面コンポーネント  |

### ファイル操作・バリデーション

| 実装内容        | ファイル配置                           | 説明                     |
| --------------- | -------------------------------------- | ------------------------ |
| ファイル検証    | `src/main/utils/file.ts`               | パス存在確認・形式検証   |
| ファイル操作IPC | `src/main/ipcHandlers/fileHandlers.ts` | ファイル選択ダイアログ   |
| ファイル型定義  | `src/types/file.ts`                    | ファイル関連の型・列挙型 |

### クラウド同期機能

| 実装内容       | ファイル配置                                           | 説明                     |
| -------------- | ------------------------------------------------------ | ------------------------ |
| R2クライアント | `src/main/r2Client.ts`                                 | AWS S3/R2接続設定        |
| アップロード   | `src/main/ipcHandlers/uploadSaveDataFolderHandlers.ts` | フォルダ一括アップロード |
| ダウンロード   | `src/main/ipcHandlers/downloadHandler.ts`              | クラウドからダウンロード |
| フォルダ一覧   | `src/main/ipcHandlers/saveDataFolderListHandler.ts`    | リモートフォルダ一覧     |
| エラー処理     | `src/main/utils/awsSdkErrorHandler.ts`                 | AWS SDKエラー解析        |

### ゲーム起動・管理

| 実装内容   | ファイル配置                                 | 説明                         |
| ---------- | -------------------------------------------- | ---------------------------- |
| ゲーム起動 | `src/main/ipcHandlers/launchGameHandlers.ts` | プロセス起動・セッション管理 |
| エラー定義 | `src/main/utils/errorHandler.ts`             | アプリケーション固有エラー   |
| 型定義     | `src/types/game.ts`                          | ゲーム関連の型定義           |

### UI コンポーネント・フック

| 実装内容                       | ファイル配置                   | 説明                   | 使用例                    |
| ------------------------------ | ------------------------------ | ---------------------- | ------------------------- |
| カスタムフック（ゲーム操作）   | `src/renderer/src/hooks/`      | 複雑なロジックの分離   | `useGameActions`          |
| カスタムフック（トースト）     | `src/renderer/src/hooks/`      | 通知処理の統一管理     | `useToastHandler`         |
| カスタムフック（ローディング） | `src/renderer/src/hooks/`      | 非同期処理状態管理     | `useLoadingState`         |
| 共通コンポーネント             | `src/renderer/src/components/` | 再利用可能なUI部品     | `GameModal`, `GameCard`   |
| ページコンポーネント           | `src/renderer/src/pages/`      | ルーティング対応ページ | `Home`, `Settings`        |
| 状態管理                       | `src/renderer/src/state/`      | Jotai atoms            | `homeState`, `gameFilter` |
| フロントエンドユーティリティ   | `src/renderer/src/utils/`      | UI専用ヘルパー関数     | `errorHandler`            |

### 型定義・共通インターフェース（拡張）

| ファイル                  | 用途           | 含まれる型                             | 新規追加 |
| ------------------------- | -------------- | -------------------------------------- | -------- |
| `src/types/result.ts`     | API結果型      | `ApiResult<T>`                         | -        |
| `src/types/game.ts`       | ゲーム関連     | `InputGameData`, `PlayStatus`          | -        |
| `src/types/creds.ts`      | 認証情報       | `Creds`, `Schema`                      | -        |
| `src/types/file.ts`       | ファイル操作   | `PathType`, `ValidatePathResult`       | -        |
| `src/types/menu.ts`       | UI状態         | `FilterOption`, `SortOption`           | -        |
| `src/types/validation.ts` | バリデーション | `ValidationResult`, `ValidationErrors` | ✅ NEW   |
| `src/types/path.ts`       | パス関連       | `PathInfo`, `PathValidation`           | ✅ NEW   |
| `src/types/common.ts`     | 共通型統一     | `SelectOption`, `LoadingState`, etc    | ✅ NEW   |

## 新機能実装例：セーブデータ比較機能（リファクタリング後）

### 1. 定数定義 (`src/constants/messages.ts`)

```typescript
export const MESSAGES = {
  // 既存のメッセージ...
  SAVE_DATA: {
    COMPARING: "セーブデータを比較しています...",
    COMPARE_SUCCESS: "比較が完了しました",
    COMPARE_FAILED: "比較に失敗しました",
    CONFLICT_FOUND: "競合が検出されました"
  }
} as const
```

### 2. 型定義追加 (`src/types/saveData.ts`)

```typescript
import type { ValidationResult } from "./validation"

export type SaveDataComparison = {
  localFiles: string[]
  remoteFiles: string[]
  conflicts: string[]
  lastSync: Date | undefined
}

export type CompareResult = ValidationResult & {
  data?: SaveDataComparison
}
```

### 3. ユーティリティ関数 (`src/utils/saveDataUtils.ts`)

```typescript
import { PATTERNS } from "../constants"

export function filterSaveFiles(files: string[]): string[] {
  return files.filter((file) => PATTERNS.SAVE_FILE_EXTENSIONS.test(file))
}

export function detectConflicts(local: string[], remote: string[]): string[] {
  return local.filter((file) => remote.includes(file))
}
```

### 4. バックエンド実装 (`src/main/service/saveDataService.ts`)

```typescript
/**
 * @fileoverview セーブデータ比較・同期サービス
 */

export async function compareSaveData(
  localPath: string,
  remotePath: string
): Promise<SaveDataComparison> {
  // 実装
}
```

### 5. IPC ハンドラー (`src/main/ipcHandlers/saveDataHandlers.ts`)

```typescript
import { MESSAGES } from "../../constants"
import { handleApiError } from "../../utils/errorHandler"

export function registerSaveDataHandlers(): void {
  ipcMain.handle("compare-save-data", async (_event, localPath, remotePath) => {
    try {
      const result = await compareSaveData(localPath, remotePath)
      return { success: true, data: result }
    } catch (error) {
      console.error(error)
      return { success: false, message: MESSAGES.SAVE_DATA.COMPARE_FAILED }
    }
  })
}
```

### 6. プリロード API (`src/preload/api/saveDataPreload.ts`)

```typescript
export const saveDataApi = {
  compareSaveData: (localPath: string, remotePath: string) =>
    ipcRenderer.invoke("compare-save-data", localPath, remotePath)
}
```

### 7. カスタムフック (`src/renderer/src/hooks/useSaveDataComparison.ts`)

```typescript
import { useToastHandler, useLoadingState } from "."
import { MESSAGES } from "../../../constants"

export function useSaveDataComparison() {
  const toastHandler = useToastHandler()
  const loadingState = useLoadingState()

  const compareData = useCallback(
    async (localPath: string, remotePath: string) => {
      return await loadingState.executeWithLoading(
        () => window.api.saveData.compareSaveData(localPath, remotePath),
        {
          loadingMessage: MESSAGES.SAVE_DATA.COMPARING,
          successMessage: MESSAGES.SAVE_DATA.COMPARE_SUCCESS,
          errorMessage: MESSAGES.SAVE_DATA.COMPARE_FAILED
        }
      )
    },
    [loadingState]
  )

  return { compareData, ...loadingState }
}
```

### 8. React コンポーネント (`src/renderer/src/components/SaveDataComparison.tsx`)

```typescript
/**
 * @fileoverview セーブデータ比較結果表示コンポーネント
 */

import { useSaveDataComparison } from "../hooks"
import { MESSAGES } from "../../../constants"

export default function SaveDataComparison() {
  const { compareData, isLoading } = useSaveDataComparison()

  // 50行以下の簡潔なコンポーネント実装
}
```

### 9. メインハンドラー登録 (`src/main/index.ts`)

```typescript
import { registerSaveDataHandlers } from "./ipcHandlers/saveDataHandlers"

app.whenReady().then(() => {
  registerSaveDataHandlers() // 追加
})
```

## コードレビューのポイント（リファクタリング後）

### リファクタリング成果活用チェック

- [ ] **定数使用**: ハードコーディングされた文字列・数値が `src/constants/` の定数で置き換えられている
- [ ] **ユーティリティ活用**: 重複処理が `src/utils/` のユーティリティ関数を使用している
- [ ] **型定義統一**: 適切な型が `src/types/` から使用されている
- [ ] **責務分離**: コンポーネントが50行以下で単一責任を守っている
- [ ] **カスタムフック**: 複雑なロジックが専用フックに分離されている
- [ ] **エラーハンドリング**: 統一されたエラーハンドラーとメッセージ定数を使用している

### 必須チェック項目

- [ ] **型安全性**: 適切な型定義があり、`any`の使用が最小限（eslint-disable使用時のみ許可）
- [ ] **エラーハンドリング**: すべての非同期処理にtry-catchがある
- [ ] **セキュリティ**: 認証情報が適切に保護されている
- [ ] **コメント**: ファイルレベルと複雑な関数にコメントがある
- [ ] **命名規約**: プロジェクトの命名規約に従っている
- [ ] **IPC通信**: 適切なチャンネル名とエラーハンドリング
- [ ] **状態管理**: Reactの状態管理が適切に実装されている

### パフォーマンスチェック

- [ ] **メモ化**: 重い計算にuseMemo/useCallbackを使用
- [ ] **非同期処理**: Promise.allで並行処理を活用
- [ ] **ファイルIO**: 大きなファイルでのストリーミング処理
- [ ] **データベース**: 効率的なクエリとインデックス使用

### 保守性チェック

- [ ] **責務分離**: 単一責任原則に従った設計
- [ ] **依存関係**: 循環依存がない
- [ ] **テスタビリティ**: 単体テストが書きやすい構造
- [ ] **ログ**: 適切なログ出力とエラー追跡
- [ ] **再利用性**: 共通処理がユーティリティ関数として抽出されている
- [ ] **一貫性**: メッセージ・設定値・パターンが定数化されている

## トラブルシューティング

### よくある問題と解決方法

| 問題                   | 原因             | 解決方法                           |
| ---------------------- | ---------------- | ---------------------------------- |
| IPC通信エラー          | ハンドラー未登録 | `registerHandlers()`の呼び出し確認 |
| 型エラー               | 型定義不整合     | 共有型定義の更新とimport確認       |
| ビルドエラー           | 依存関係問題     | `npm install`と型定義確認          |
| 認証エラー             | keytar接続失敗   | OS権限とキーチェーン設定確認       |
| ファイルアクセスエラー | 権限不足         | ファイルパスと権限確認             |

### デバッグ手順

1. **ログ確認**: Console.logとElectronのDevTools
2. **品質確保コマンド実行**:
   - `npm run typecheck` - 型チェック
   - `npm run lint` - コードチェック
   - `npm run format` - コード整形
   - `npm run build` - ビルド確認
3. **IPC通信確認**: プリロードAPIの動作テスト
4. **データベース確認**: Prisma Studioでデータ確認
5. **テスト実行**: `npm run test` または `npm run test:vitest`

## リファクタリング成果を活用した開発のメリット

### 開発効率向上

- **定数化**: メッセージや設定値の変更が一箇所で完結
- **ユーティリティ**: 共通処理の再利用でコード重複削除
- **型安全**: 統一された型定義でバグ予防
- **責務分離**: 小さなモジュールで理解・保守が容易

### コード品質向上

- **一貫性**: 統一されたパターンとコーディング規約
- **テスタビリティ**: 小さな単位でのテストが容易
- **保守性**: 明確な責務分離と依存関係
- **再利用性**: カスタムフックとユーティリティの活用

このガイドとリファクタリング成果を活用することで、高品質で保守しやすいコードベースを継続的に維持できます。
