# Cloud Launch

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Cloud Launch**は、PCゲームのセーブデータをS3互換のクラウドストレージに同期し、複数のデバイスでゲームの進行状況を管理するためのデスクトップアプリケーションです。プレイ時間の記録やチャプターごとの管理機能も搭載しています。

---

## ⚠️ 現在のステータス (Current Status)

> [!IMPORTANT]
> **CloudLaunchは現在ベータ版として開発されています。**
> テストリリース版をリリースしました！[Releases](https://github.com/fuyu28/CloudLaunch/releases)からダウンロードできます。
> 開発環境から起動する場合は、下記の手順をご参照ください。

> [!WARNING]
> **プラットフォーム対応状況**:
>
> - ✅ **Windows 10/11**: 完全対応・テスト済み
> - ⚠️ **macOS/Linux**: 限定的な対応（一部機能が動作しない可能性があります）

---

## ✨ 主な機能 (Features)

### 🎮 ゲーム管理

- **ゲームライブラリ**: PCにインストールされているゲームを登録・管理
- **プレイ状況追跡**: 自動プレイ時間計測と「未プレイ」「プレイ中」「プレイ済み」のステータス管理
- **チャプター管理**: ゲームの章ごとにプレイ時間をグラフで可視化
- **テーマ切り替え機能**: 設定画面からアプリテーマを自由に変更できる機能 (Daisy UI標準テーマ)

### ☁️ クラウド同期

- **セーブデータ同期**: S3互換ストレージ（AWS S3, Cloudflare R2など）との連携
- **プレイメモ同期**: Markdown形式メモのクラウドバックアップ・同期
- **安全な認証**: OSキーチェーンによる認証情報の暗号化保存

### 📝 プレイメモ機能

- **Markdownエディタ**: リアルタイムプレビュー付きメモ作成・編集
- **ゲーム連携**: ゲームごとにメモを整理・管理
- **クラウド連携**: メモの自動バックアップと複数デバイス間同期
- **ファイル管理**: ローカルファイルシステムとの連携

### 📊 プレイ分析

- **詳細統計**: 総プレイ時間、平均プレイ時間、今週のプレイ時間
- **章別分析**: チャプターごとのプレイ時間可視化
- **セッション記録**: 個別プレイセッションの詳細追跡

---

## 🗺️ 今後の実装予定 (Roadmap)

現在、以下の機能の追加を検討しています。

### 一般機能

- **[ ] スクリーンショット管理機能**: ゲームのスクリーンショットを撮影し、ゲームごとに整理・閲覧する機能

### ゲーム連携機能

- **[ ] 批評空間からのデータ取得**: ゲーム登録時に、[批評空間](http://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/)からゲーム名、ブランド名、ジャケット画像などのメタデータを自動で取得する機能
- **[ ] 実績システム**: ゲーム達成度の管理機能

### エクスポート・インポート機能

- **[ ] データエクスポート**: ゲーム情報・統計データのCSV/JSON出力
- **[ ] バックアップ機能**: 全データの包括的バックアップ・復元

---

## 🚀 使い方 (How to Use)

### インストーラーからの利用 (推奨)

[Releases](https://github.com/fuyu28/CloudLaunch/releases)から最新版のインストーラーをダウンロードし、実行してください。

### 開発環境からの起動

### 必要要件 (Prerequisites)

- [Node.js](https://nodejs.org/) (v22.x or later)
- [npm](https://www.npmjs.com/) (v10.x or later)

### セットアップと起動手順

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/fuyu28/cloudlaunch.git
   cd cloudlaunch
   ```

2. **依存関係をインストール**

   ```bash
   npm install
   ```

3. **データベースをセットアップ**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **開発モードでアプリを起動**

   ```bash
   npm run dev
   ```

5. アプリが起動したら、サイドバーの歯車アイコンから設定画面を開き、S3互換ストレージの情報を入力してください。

   S3互換ストレージとして推奨しているCloudflare R2の設定方法については、以下のガイドを参照してください。

   - **[Cloudflare R2セットアップガイド](./docs/CLOUDFLARE_R2_SETUP_GUIDE.md)**

---

## 🔐 セキュリティとプライバシー

- **認証情報の保存について**:
  設定画面で入力されたS3/R2のクレデンシャル（アクセスキー、シークレットキーなど）は、お使いのPCのOSが提供するセキュアな認証情報管理システム（Windows Credential Managerなど）を利用して**ローカルに保存されます**。
- **外部への送信について**:
  保存されたクレデンシャルは、ユーザーがセーブデータをアップロードまたはダウンロードする際に、指定されたS3互換ストレージへの認証目的でのみ使用されます。**開発者を含む第三者にこれらの情報が送信されることは一切ありません。**

---

## ⚠️ 免責事項 (Disclaimer)

このアプリケーションは、作者の個人的な学習と利用を目的として開発されたものであり、無保証で提供されます。

- このアプリケーションの使用によって生じたいかなる損害（データの損失、破損、アカウントへの不正アクセスなどを含むがこれに限らない）についても、開発者は一切の責任を負いません。
- セーブデータのような重要なデータを取り扱う際は、**必ずご自身でバックアップを作成した上で、自己責任でご利用ください。**

---

## 🛠️ 開発者向け情報 (for Developers)

### ビルド（将来的な計画）

> [!NOTE]
> 以下のビルドプロセスは将来的な配布を想定したものですが、**現時点ではテストされておらず、正常に動作することは保証されません。**
> インストーラーを生成する機能はまだ実験的なものです。

アプリケーションを配布用にビルドする際は、以下のコマンドを使用します。

```bash
# Windows
npm run build:win

# macOS (未テスト)
npm run build:mac

# Linux (未テスト)
npm run build:linux
```

### 技術スタック (Tech Stack)

#### フロントエンド

- **フレームワーク**: [Electron](https://www.electronjs.org/) 35.1.5
- **UI**: [React](https://reactjs.org/) 19.1.0, [TypeScript](https://www.typescriptlang.org/) 5.8.3
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/) 4.1.10, [daisyUI](https://daisyui.com/) 5.0.43
- **状態管理**: [Jotai](https://jotai.org/) 2.12.5
- **ルーティング**: [React Router](https://reactrouter.com/) 7.6.2
- **Markdownエディタ**: [React MD Editor](https://uiwjs.github.io/react-md-editor/) 4.0.7

#### バックエンド・データ

- **データベース**: [Prisma](https://www.prisma.io/) 6.11.0, [SQLite](https://www.sqlite.org/index.html) 5.1.7
- **クラウド接続**: [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/) 3.828.0
- **プロセス監視**: [ps-list](https://github.com/sindresorhus/ps-list) 8.1.1
- **認証情報管理**: [keytar](https://github.com/atom/node-keytar) 7.9.0
- **設定管理**: [electron-store](https://github.com/sindresorhus/electron-store) 10.1.0

#### 開発・ビルド

- **ビルドツール**: [Electron Vite](https://electron-vite.org/) 3.1.0, [Vite](https://vitejs.dev/) 6.2.6
- **パッケージング**: [Electron Builder](https://www.electron.build/) 25.1.8
- **テスト**: [Vitest](https://vitest.dev/) 3.2.4, [Jest](https://jestjs.io/) 30.0.4
- **コード品質**: [ESLint](https://eslint.org/) 9.24.0, [Prettier](https://prettier.io/) 3.5.3

### プロジェクト構造 (Project Structure)

```
cloudlaunch/
├── docs/                    # ドキュメント
├── prisma/                  # データベース（Prisma + SQLite）
├── resources/              # 静的リソース（アイコン等）
├── src/
│   ├── constants/          # 定数定義
│   ├── main/               # Electronメインプロセス
│   │   ├── ipcHandlers/   # IPC通信ハンドラー
│   │   ├── service/       # ビジネスロジック
│   │   └── utils/         # ユーティリティ
│   ├── preload/           # セキュリティブリッジ
│   ├── renderer/          # React UI
│   │   └── src/
│   │       ├── components/ # UIコンポーネント
│   │       ├── hooks/     # カスタムフック
│   │       ├── pages/     # ページコンポーネント
│   │       └── state/     # 状態管理
│   ├── types/             # TypeScript型定義
│   └── utils/             # 共通ユーティリティ
└── dist/                  # ビルド出力
```

---

## 📄 ライセンス (License)

このプロジェクトは [MIT License](./LICENSE) の下で公開されています。
