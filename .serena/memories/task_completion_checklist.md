# タスク完了時のチェックリスト

## 必須実行コマンド（この順序で実行）
1. `npm run typecheck` - TypeScriptエラーチェック
2. `npm run lint -- --fix` - ESLint自動修正
3. テストが存在する場合: `npm run test` または `npm run test:vitest`

## 注意事項
- これらのコマンドは時間がかかるため、別々に実行することを推奨
- `npm run build` は通常不要（特別な指示がない限り）
- エラーが発生した場合は必ず修正してから完了とする

## データベース関連作業時
- マイグレーション: `npx prisma migrate dev`
- クライアント再生成: `npx prisma generate`

## ファイル作成時の追加要件
- ファイルの目的と機能をコメントで説明
- 関数の場合: 目的、引数、戻り値を明記
- `any` 型使用時は必ず `eslint-disable-next-line` でエラー名を指定