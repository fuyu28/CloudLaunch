# Cloud Launch

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

**Cloud Launch**は、PCゲームのセーブデータをS3互換のクラウドストレージに同期し、複数のデバイスでゲームの進行状況を管理するためのデスクトップアプリケーションです。プレイ時間の記録やチャプターごとの管理機能も搭載しています。

---

## ✨ 主な機能 (Features)

- **セーブデータのクラウド同期**:
  - ゲームのセーブデータフォルダを指定し、S3互換ストレージ（AWS S3, Cloudflare R2など）にアップロード/ダウンロードできます。
  - これにより、複数のPCでゲームの続きをプレイすることが容易になります。
- **ゲーム管理**:
  - PCにインストールされているゲームをライブラリとして登録・管理できます。
  - ゲームのタイトル、パブリッシャー、実行ファイルのパス、画像などを設定可能です。
- **プレイ状況の追跡**:
  - ゲームのプレイ時間を自動で記録し、総プレイ時間や最終プレイ日時を確認できます。
  - 「未プレイ」「プレイ中」「プレイ済み」のステータス管理が可能です。
- **チャプター管理**:
  - ゲームの章（チャプター）ごとにプレイ時間をグラフで可視化し、進行度を把握できます。
- **安全な認証情報管理**:
  - クラウドストレージの認証情報は、OSのセキュアな機構（keytar）を利用して安全に保存されます。

---

## 🚀 インストールと使い方 (for Users)

> [!WARNING]
> 現在、このアプリケーションは**Windows**でのみ開発・テストされています。macOSおよびLinuxでは正常に動作しない可能性があります。

### 推奨（インストーラーを使用）

1. **[Releasesページ](https://github.com/fuyu28/cloudlaunch/releases)**から、最新版の`.exe`インストーラーをダウンロードして実行します。
2. アプリを起動し、サイドバーの歯車アイコンから設定画面を開きます。
3. S3互換ストレージの情報を入力し、接続をテストします。
4. ホーム画面右下の「+」ボタンから、管理したいゲームを登録します。
5. 登録したゲームの詳細画面から、セーブデータのアップロードやダウンロードを実行できます。

### 上級者向け（セルフビルド）

ご自身でソースコードからビルドして使用することも可能です。

1. [開発者向け情報](#️-開発者向け情報-for-developers)の**セットアップ手順**に従い、プロジェクトをセットアップします。
2. 以下のコマンドでアプリケーションをビルドします。
   ```bash
   # Windows向けにビルド
   npm run build:win
   ```
3. ビルドが完了すると、`dist`ディレクトリ内にインストーラー（`.exe`）が生成されます。これを実行してインストールしてください。

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

このプロジェクトをローカル環境でセットアップし、開発に参加するための手順です。

### 必要要件 (Prerequisites)

- [Node.js](https://nodejs.org/) (v22.x or later)
- [npm](https://www.npmjs.com/) (v10.x or later)

### セットアップ手順 (Installation)

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
   Prismaがデータベーススキーマを生成し、マイグレーションを適用します。
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### 開発環境の起動 (Running in Development)

以下のコマンドを実行すると、Electronアプリが開発モードで起動します。

```bash
npm run dev
```

### ビルド (Building for Production)

アプリケーションを配布用にビルドします。

```bash
# Windows
npm run build:win

# macOS (未テスト)
npm run build:mac

# Linux (未テスト)
npm run build:linux
```

ビルドされたパッケージは `dist` ディレクトリに出力されます。

---

## 💻 技術スタック (Tech Stack)

- **フレームワーク**: [Electron](https://www.electronjs.org/)
- **UI**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [daisyUI](https://daisyui.com/)
- **状態管理**: [Jotai](https://jotai.org/)
- **データベース**: [Prisma](https://www.prisma.io/), [SQLite](https://www.sqlite.org/index.html)
- **クラウド接続**: [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/)
- **ビルドツール**: [Electron Vite](https://electron-vite.org/)
- **パッケージング**: [Electron Builder](https://www.electron.build/)
- **テスト**: [Vitest](https://vitest.dev/), [Jest](https://jestjs.io/)

---

## 📂 プロジェクト構造 (Project Structure)

主要なディレクトリの役割は以下の通りです。

```
cloudlaunch/
├── dist/              # ビルド後のパッケージが出力されるディレクトリ
├── prisma/            # Prismaのスキーマ定義とマイグレーションファイル
└── src/
    ├── main/          # Electronのメインプロセス (バックエンドロジック、Node.js API)
    ├── preload/       # メインプロセスとレンダラープロセスを安全に繋ぐスクリプト
    └── renderer/      # Electronのレンダラープロセス (UI、Reactアプリケーション)
```

---

## 📄 ライセンス (License)

このプロジェクトは [MIT License](./LICENSE.md) の下で公開されています。
