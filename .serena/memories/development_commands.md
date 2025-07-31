# 開発コマンド

## 基本開発コマンド
- `npm run dev` - 開発サーバー起動（ホットリロード付き）
- `npm run build` - アプリケーションビルド（typecheckも実行）
- `npm run typecheck` - TypeScriptチェック（node/web両方）
- `npm run lint` - ESLintチェック
- `npm run lint -- --fix` - ESLint自動修正
- `npm run format` - Prettierフォーマット

## データベース操作
- `npx prisma migrate dev` - 開発環境でのマイグレーション適用
- `npx prisma generate` - Prismaクライアント生成
- `npx prisma db seed` - テストデータの追加

## テスト
- `npm run test` - Jestテスト実行
- `npm run test:vitest` - Vitestテスト実行
- `npm run test:coverage` - カバレッジ付きテスト

## プラットフォーム別ビルド
- `npm run build:win` - Windows向けビルド
- `npm run build:mac` - macOS向けビルド
- `npm run build:linux` - Linux向けビルド

## 重要な開発時注意事項
- タスク完了前に `npm run typecheck` と `npm run lint -- --fix` を必須実行
- Windows環境では `chcp 65001` でUTF-8エンコーディング設定済み