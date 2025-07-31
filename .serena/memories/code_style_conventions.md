# コードスタイルと規約

## 基本方針
- **言語**: 必ず日本語で出力
- **コメント**: anyの使用時は `// eslint-disable-next-line [エラー名]` で一時的にオフ
- **エラー変数**: `error` に統一（`err` ではない）
- **型安全**: `any` は極力使用禁止、やむを得ない場合のみ eslint-disable で対処

## 変数命名規約
- `gameData` (ゲーム情報)
- `localPath`, `remotePath` (パス関連)
- `result`, `credentialResult` (結果変数)

## ファイル構造と命名
- **ファイル説明**: 重要ファイルには `@fileoverview` コメント必須
- **関数説明**: 新しい関数作成時は目的、引数、戻り値をコメントで説明

## ESLint設定
- TypeScript一貫型imports: `@typescript-eslint/consistent-type-imports` 
- import順序: external → internal → relative/type
- 同グループ内アルファベット順ソート
- グループ間空行必須

## 型システム
- `ApiResult<T>` 型で統一的なエラー処理
- 厳密なTypeScript設定
- Zodスキーマ使用によるランタイム型検証

## セキュリティ
- 認証情報はkeytar（OSキーチェーン）で保護
- Context isolation有効なpreloadブリッジ使用