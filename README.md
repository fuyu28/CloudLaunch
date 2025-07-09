# Cloud Launch

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Cloud Launch**は、PCゲームのセーブデータをS3互換のクラウドストレージに同期し、複数のデバイスでゲームの進行状況を管理するためのデスクトップアプリケーションです。プレイ時間の記録やチャプターごとの管理機能も搭載しています。

---

## ⚠️ 現在のステータス (Current Status)

> [!IMPORTANT]
> **このアプリケーションは現在、活発な開発段階にあります。**
> まだテストや評価を目的としたプレリリース版を含め、**いかなるリリースも行われていません。**
> そのため、現時点での利用方法は、ソースコードから直接開発環境を起動する方法のみとなります。

> [!WARNING]
> 現在、開発およびテストは **Windows環境のみ** で行われています。
> macOSおよびLinuxでは正常に動作しない可能性が高いです。

---

## ✨ 主な機能 (Features)

- **セーブデータのクラウド同期**:
  - ゲームのセーブデータフォルダを指定し、S3互換ストレージ（AWS S3, Cloudflare R2など）にアップロード/ダウンロードできます。
- **ゲーム管理**:
  - PCにインストールされているゲームをライブラリとして登録・管理できます。
- **プレイ状況の追跡**:
  - ゲームのプレイ時間を自動で記録し、総プレイ時間や最終プレイ日時を確認できます。
  - 「未プレイ」「プレイ中」「プレイ済み」のステータス管理が可能です。
- **チャプター管理**:
  - ゲームの章（チャプター）ごとにプレイ時間をグラフで可視化し、進行度を把握できます。
- **安全な認証情報管理**:
  - クラウドストレージの認証情報は、OSのセキュアな機構を利用してローカルに安全に保存されます。

---

## 🗺️ 今後の実装予定 (Roadmap)

現在、以下の機能の追加を検討しています。

### 一般機能

- **[ ] プレイメモ機能**: ゲームごとにMarkdown形式でメモを記録・表示する機能。
- **[ ] スクリーンショット管理機能**: ゲームのスクリーンショットを撮影し、ゲームごとに整理・閲覧する機能。
- **[ ] テーマ切り替え機能**: 設定画面からDaisyUIのテーマを自由に変更できる機能。

### ノベルゲーム向け機能

- **[ ] 批評空間からのデータ取得**: ゲーム登録時に、[批評空間](http://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/)からゲーム名、ブランド名、ジャケット画像などのメタデータを自動で取得する機能。

---

## 🚀 使い方 (How to Use)

前述の通り、現在このアプリケーションは開発環境で直接起動する必要があります。

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

- **フレームワーク**: [Electron](https://www.electronjs.org/)
- **UI**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [daisyUI](https://daisyui.com/)
- **状態管理**: [Jotai](https://jotai.org/)
- **データベース**: [Prisma](https://www.prisma.io/), [SQLite](https://www.sqlite.org/index.html)
- **クラウド接続**: [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/)
- **ビルドツール**: [Electron Vite](https://electron-vite.org/)
- **パッケージング**: [Electron Builder](https://www.electron.build/)
- **テスト**: [Vitest](https://vitest.dev/), [Jest](https://jestjs.io/)

### プロジェクト構造 (Project Structure)

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

このプロジェクトは [MIT License](./LICENSE) の下で公開されています。
