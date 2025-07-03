# GameSync 開発ワークフローガイド

## どこに何を書けばいいか - 機能別ガイド

### 新機能開発の流れ

1. **要件定義** → 機能仕様をCLAUDE.mdまたはissueに記録
2. **型定義** → `src/types/` に型を定義
3. **バックエンド実装** → メインプロセスで処理ロジック実装
4. **IPC通信** → プリロードAPIとハンドラーを実装
5. **フロントエンド** → React コンポーネントで UI 実装
6. **テスト** → 機能テストと統合テスト
7. **ドキュメント更新** → CLAUDE.md、README更新

## ファイル配置ガイド

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

### UI コンポーネント

| 実装内容                     | ファイル配置                   | 説明                   |
| ---------------------------- | ------------------------------ | ---------------------- |
| 共通コンポーネント           | `src/renderer/src/components/` | 再利用可能なUI部品     |
| ページコンポーネント         | `src/renderer/src/pages/`      | ルーティング対応ページ |
| 状態管理                     | `src/renderer/src/state/`      | Jotai atoms            |
| フロントエンドユーティリティ | `src/renderer/src/utils/`      | UI専用ヘルパー関数     |

### 型定義・共通インターフェース

| ファイル              | 用途         | 含まれる型                       |
| --------------------- | ------------ | -------------------------------- |
| `src/types/result.ts` | API結果型    | `ApiResult<T>`                   |
| `src/types/game.ts`   | ゲーム関連   | `InputGameData`, `PlayStatus`    |
| `src/types/creds.ts`  | 認証情報     | `Creds`, `Schema`                |
| `src/types/file.ts`   | ファイル操作 | `PathType`, `ValidatePathResult` |
| `src/types/menu.ts`   | UI状態       | `FilterName`, `SortName`         |

## 新機能実装例：セーブデータ比較機能

### 1. 型定義追加 (`src/types/saveData.ts`)

```typescript
export type SaveDataComparison = {
  localFiles: string[]
  remoteFiles: string[]
  conflicts: string[]
  lastSync: Date | null
}
```

### 2. バックエンド実装 (`src/main/service/saveDataService.ts`)

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

### 3. IPC ハンドラー (`src/main/ipcHandlers/saveDataHandlers.ts`)

```typescript
export function registerSaveDataHandlers(): void {
  ipcMain.handle("compare-save-data", async (_event, localPath, remotePath) => {
    try {
      const result = await compareSaveData(localPath, remotePath)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, message: "比較に失敗しました" }
    }
  })
}
```

### 4. プリロード API (`src/preload/api/saveDataPreload.ts`)

```typescript
export const saveDataApi = {
  compareSaveData: (localPath: string, remotePath: string) =>
    ipcRenderer.invoke("compare-save-data", localPath, remotePath)
}
```

### 5. React コンポーネント (`src/renderer/src/components/SaveDataComparison.tsx`)

```typescript
/**
 * @fileoverview セーブデータ比較結果表示コンポーネント
 */

export default function SaveDataComparison() {
  // コンポーネント実装
}
```

### 6. メインハンドラー登録 (`src/main/index.ts`)

```typescript
import { registerSaveDataHandlers } from "./ipcHandlers/saveDataHandlers"

app.whenReady().then(() => {
  registerSaveDataHandlers() // 追加
})
```

## コードレビューのポイント

### 必須チェック項目

- [ ] **型安全性**: 適切な型定義があり、`any`の使用が最小限
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
2. **型チェック**: `npm run typecheck`実行
3. **Lint実行**: `npm run lint`でコードチェック
4. **IPC通信確認**: プリロードAPIの動作テスト
5. **データベース確認**: Prisma Studioでデータ確認

このガイドに従って開発を進めることで、一貫性があり保守しやすいコードベースを維持できます。
