# Cloud Launch プロジェクト概要

## プロジェクトの目的
PCゲームのセーブデータをS3互換のクラウドストレージに同期し、複数のデバイスでゲームの進行状況を管理するためのデスクトップアプリケーション。プレイ時間の記録やチャプターごとの管理機能も搭載。

## 技術スタック

### フロントエンド
- **フレームワーク**: Electron 35.1.5
- **UI**: React 19.1.0, TypeScript 5.8.3
- **スタイリング**: Tailwind CSS 4.1.10, daisyUI 5.0.43
- **状態管理**: Jotai 2.12.5
- **ルーティング**: React Router 7.6.2

### バックエンド・データ
- **データベース**: Prisma 6.11.0, SQLite with better-sqlite3 12.2.0
- **クラウド接続**: AWS SDK for JavaScript v3 3.828.0
- **認証情報管理**: keytar 7.9.0 (OSキーチェーン)
- **設定管理**: electron-store 10.1.0

### 開発・ビルド
- **ビルドツール**: Electron Vite 3.1.0, Vite 6.2.6
- **パッケージング**: Electron Builder 25.1.8
- **テスト**: Vitest 3.2.4, Jest 30.0.4
- **コード品質**: ESLint 9.24.0, Prettier 3.5.3

## プロジェクト構造
```
src/
├── main/           # Electronメインプロセス
│   ├── ipcHandlers/   # IPC通信ハンドラー
│   ├── service/       # ビジネスロジック
│   └── utils/         # ユーティリティ
├── preload/        # セキュリティブリッジ
├── renderer/       # React UI
│   └── src/
│       ├── components/ # UIコンポーネント
│       ├── hooks/     # カスタムフック
│       ├── pages/     # ページコンポーネント
│       └── state/     # 状態管理
├── types/          # TypeScript型定義
└── utils/          # 共通ユーティリティ
```