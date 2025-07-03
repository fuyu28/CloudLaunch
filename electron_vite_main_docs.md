## Electron-Vite プロジェクト ドキュメント

### 概要

このドキュメントでは、Electron-Vite プロジェクトの各レイヤーに分けて説明します。

1. メインプロセス (`src/main`)
2. プリロードスクリプト (`src/preload`)
3. レンダラープロセス (`src/renderer/src`)
4. 共通型定義 (`src/types`)

---

# 1. メインプロセス (`src/main`)

```
src/main
├── index.ts
├── r2Client.ts
├── registerHandlers.ts
└── ipcHandlers
    ├── fileDialogHandlers.ts
    ├── registerGetR2FolderListHandler.ts
    └── uploadHandlers.ts
```

#### 1.1 `index.ts`

- **役割**: Electron アプリのエントリーポイント。
- **処理**: ウィンドウ生成、HTML/URL読み込み、DevToolsショートカット、IPC登録 (`registerHandlers`)。
- **利用**: アプリ起動シーケンスの定義時。

#### 1.2 `r2Client.ts`

- **役割**: Cloudflare R2 用 `S3Client` の初期化。
- **処理**: 環境変数読み込み、認証情報設定、インスタンス生成。
- **利用**: R2操作が必要なIPCハンドラー作成時。

#### 1.3 `registerHandlers.ts`

- **役割**: メインに定義したIPCハンドラーを一括登録。
- **処理**: 各 `ipcHandlers/*` の登録関数を呼び出し。
- **利用**: ハンドラー追加・削除時の一括管理。

#### 1.4 `ipcHandlers/fileDialogHandlers.ts`

- **役割**: ファイル/フォルダ選択ダイアログのIPC実装。
- **処理**: `select-exe`, `select-folder` チャンネルの `ipcMain.handle`。
- **利用**: ローカルパス入力をUIで促す時。

#### 1.5 `ipcHandlers/registerGetR2FolderListHandler.ts`

- **役割**: R2バケットのフォルダ一覧取得。
- **処理**: `ListObjectsV2Command` でプレフィックス（`Delimiter: '/'`）を取得。
- **利用**: R2のディレクトリ構造を表示・選択させる時。

#### 1.6 `ipcHandlers/uploadHandlers.ts`

- **役割**: ローカルからR2への一括アップロード実装。
- **処理**: `fs.readdir` → `PutObjectCommand` でアップロード。
- **利用**: ユーザー指定フォルダをR2に送る機能を実装時。

---

# 2. プリロードスクリプト (`src/preload`)

```
src/preload
├── index.ts
├── preload.d.ts
├── index.d.ts
└── api
    ├── fileDialogPreload.ts
    ├── r2ListPreload.ts
    └── uploadPreload.ts
```

#### 2.1 `index.ts`

- **役割**: Preload全体の組み立て。
- **処理**:
  - `@electron-toolkit/preload` の `electronAPI` を `contextBridge` 経由で公開
  - `api/*` の IPC ラッパーをまとめて `window.api` に公開
- **利用**: レンダラー側へ安全にIPCを露出する時。

#### 2.2 `preload.d.ts`

- **役割**: カスタムAPIの型定義。
- **内容**: `FileDialogAPI`, `UploadAPI`, `GetR2ListAPI`, それらをまとめた `API`。
- **利用**: TSで `window.api` を型チェックしたい時。

#### 2.3 `index.d.ts`

- **役割**: グローバル `window` の型拡張。
- **内容**: `window.electron: ElectronAPI`, `window.api: API`。
- **利用**: レンダラーで補完と型エラーを防ぐ時。

#### 2.4 `api/fileDialogPreload.ts`

- **役割**: ファイル選択IPC呼び出し。
- **処理**: `ipcRenderer.invoke('select-exe')`, `invoke('select-folder')`。
- **利用**: レンダラーでファイル・フォルダ選択を実装時。

#### 2.5 `api/r2ListPreload.ts`

- **役割**: R2フォルダ一覧取得呼び出し。
- **処理**: `ipcRenderer.invoke('get-r2-folder-list')`。
- **利用**: レンダラーでR2のディレクトリを表示時。

#### 2.6 `api/uploadPreload.ts`

- **役割**: フォルダアップロード呼び出し。
- **処理**: `ipcRenderer.invoke('upload-folder', localPath, destPath)`。
- **利用**: レンダラーでアップロード機能を実装時。

---

# 3. レンダラープロセス (`src/renderer/src`)

```
src/renderer/src
├── main.tsx
├── App.tsx
├── env.d.ts
├── assets
│   └── tailwind.css
└── components   ← 現在空
```

#### 3.1 `main.tsx`

- **役割**: Reactアプリのエントリーポイント。
- **処理**: `createRoot(...).render(<App />)`、グローバルCSSインポート。
- **利用**: React + Vite プロジェクトの初期セットアップ。

#### 3.2 `App.tsx`

- **役割**: メインUIコンポーネント。
- **処理**:
  - フォルダ選択 (`window.api.fileDialog.selectFolder()`)
  - R2アップロードパス設定
  - アップロード実行 (`window.api.upload.uploadFolder`)
  - ローディング、エラー／成功メッセージ表示
  - TailwindCSS + daisyUI ボタン／入力スタイル適用
- **利用**: UIフロー実装時。

#### 3.3 `env.d.ts`

- **役割**: Vite用環境変数型定義。
- **内容**: `<reference types="vite/client" />`。
- **利用**: `import.meta.env` の安全な利用。

#### 3.4 `assets/tailwind.css`

- **役割**: TailwindCSS と daisyUI プラグイン設定。
- **内容**:
  ```css
  @import "tailwindcss";
  @plugin 'daisyui' {
    themes:
      light --default,
      dark --prefersdark,
      cupcake;
  }
  ```
- **利用**: テーマとユーティリティクラス定義。

#### 3.5 `components/`

- **現状**: 空フォルダ。
- **提案**: ボタン、入力、モーダルなどの再利用可能コンポーネント配置。

---

# 4. 共通型定義 (`src/types`)

```
src/types
└── env.d.ts
```

#### 4.1 `env.d.ts`

- **役割**: Node.js 環境変数の型定義。
- **内容**:
  ```ts
  declare namespace NodeJS {
    interface ProcessEnv {
      readonly BUCKET_NAME: string
      readonly ENDPOINT: string
      readonly ACCESS_KEY_ID: string
      readonly SECRET_ACCESS_KEY: string
    }
  }
  ```
- **利用**: メインプロセスで `process.env.*` の安全な参照。

---

> 次のステップ: 共通 Hooks / 状態管理（Zustand など）の導入計画や、大規模化時のディレクトリ整理パターンを検討します。
