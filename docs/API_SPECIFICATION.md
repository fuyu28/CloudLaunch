# CloudLaunch API仕様書

## 目次

1. [概要](#概要)
2. [IPC通信の基本構造](#IPC通信の基本構造)
3. [共通型定義](#共通型定義)
4. [ゲーム管理API](#ゲーム管理API)
5. [章管理API](#章管理API)
6. [プレイセッション管理API](#プレイセッション管理API)
7. [プロセス監視API](#プロセス監視API)
8. [クラウド同期API](#クラウド同期API)
9. [認証情報管理API](#認証情報管理API)
10. [ファイル操作API](#ファイル操作API)
11. [設定管理API](#設定管理API)
12. [エラーハンドリング](#エラーハンドリング)

## 概要

CloudLaunchは、ElectronのIPC（Inter-Process Communication）機能を使用してフロントエンド（Renderer Process）とバックエンド（Main Process）間で通信を行います。

### API設計原則

- 型安全性の確保
- 統一されたエラーハンドリング
- 予測可能なレスポンス形式
- セキュリティを考慮したデータ検証

## IPC通信の基本構造

### 通信フロー

```
Frontend (Renderer) → Preload Script → Main Process → Response
```

### API呼び出し方式

```typescript
// フロントエンドからの呼び出し
const result = await window.api.game.getGames()

// バックエンドでの処理
ipcMain.handle("get-games", async () => {
  // 処理実装
  return { success: true, data: games }
})
```

## 共通型定義

### ApiResult型

```typescript
export type ApiResult<T = void> = { success: true; data?: T } | { success: false; message: string }
```

### 使用例

```typescript
// 成功時
{ success: true, data: gamesList }

// エラー時
{ success: false, message: "ゲームの取得に失敗しました" }
```

## ゲーム管理API

### 1. ゲーム一覧取得

#### `get-games`

**説明**: 登録されている全ゲームの一覧を取得

**パラメータ**: なし

**戻り値**: `ApiResult<GameType[]>`

```typescript
interface GameType {
  id: string
  title: string
  publisher: string
  saveFolderPath?: string
  exePath: string
  imagePath?: string
  createdAt: Date
  playStatus: PlayStatus
  totalPlayTime: number
  lastPlayed: Date | null
  clearedAt: Date | null
  currentChapter: string | null
}

type PlayStatus = "UNPLAYED" | "PLAYING" | "COMPLETED"
```

**呼び出し例**:

```typescript
const result = await window.api.game.getGames()
if (result.success) {
  const games = result.data // GameType[]
}
```

### 2. ゲーム作成

#### `create-game`

**説明**: 新しいゲームを登録

**パラメータ**: `InputGameData`

```typescript
interface InputGameData {
  title: string
  publisher: string
  imagePath?: string
  exePath: string
  saveFolderPath?: string
  playStatus: PlayStatus
}
```

**戻り値**: `ApiResult<GameType>`

**バリデーション**:

- `title`: 必須、空文字不可
- `publisher`: 必須、空文字不可
- `exePath`: 必須、ファイル存在確認
- `imagePath`: 任意、存在する場合はファイル確認
- `saveFolderPath`: 任意、存在する場合はフォルダ確認

**呼び出し例**:

```typescript
const gameData: InputGameData = {
  title: "サンプルゲーム",
  publisher: "サンプル出版社",
  exePath: "C:/Games/sample/game.exe",
  playStatus: "UNPLAYED"
}

const result = await window.api.game.createGame(gameData)
```

### 3. ゲーム更新

#### `update-game`

**説明**: 既存ゲームの情報を更新

**パラメータ**:

- `gameId: string`
- `updateData: Partial<InputGameData>`

**戻り値**: `ApiResult<GameType>`

**呼び出し例**:

```typescript
const result = await window.api.game.updateGame("game-uuid", {
  title: "新しいタイトル",
  playStatus: "PLAYING"
})
```

### 4. ゲーム削除

#### `delete-game`

**説明**: ゲームを削除（関連データも削除）

**パラメータ**: `gameId: string`

**戻り値**: `ApiResult`

**削除対象**:

- ゲーム本体
- 関連するプレイセッション
- 関連する章データ
- 関連するアップロード履歴

**呼び出し例**:

```typescript
const result = await window.api.game.deleteGame("game-uuid")
```

### 5. プレイステータス更新

#### `update-play-status`

**説明**: ゲームのプレイステータスを更新

**パラメータ**:

- `gameId: string`
- `playStatus: PlayStatus`

**戻り値**: `ApiResult`

**副作用**:

- `COMPLETED`に変更時、`clearedAt`に現在時刻を設定
- `lastPlayed`を現在時刻に更新

**呼び出し例**:

```typescript
const result = await window.api.game.updatePlayStatus("game-uuid", "COMPLETED")
```

## 章管理API

### 1. 章一覧取得

#### `get-chapters`

**説明**: 指定ゲームの章一覧を取得

**パラメータ**: `gameId: string`

**戻り値**: `ApiResult<Chapter[]>`

```typescript
interface Chapter {
  id: string
  name: string
  order: number
  gameId: string
  createdAt: Date
}
```

**呼び出し例**:

```typescript
const result = await window.api.chapter.getChapters("game-uuid")
```

### 2. 章作成

#### `create-chapter`

**説明**: 新しい章を作成

**パラメータ**: `ChapterCreateInput`

```typescript
interface ChapterCreateInput {
  name: string
  gameId: string
}
```

**戻り値**: `ApiResult<Chapter>`

**処理内容**:

- 自動的に最後の順序番号を設定
- デフォルト章が存在しない場合は作成

**呼び出し例**:

```typescript
const result = await window.api.chapter.createChapter({
  name: "第1章",
  gameId: "game-uuid"
})
```

### 3. 章更新

#### `update-chapter`

**説明**: 章の情報を更新

**パラメータ**:

- `chapterId: string`
- `updateData: ChapterUpdateInput`

```typescript
interface ChapterUpdateInput {
  name?: string
  order?: number
}
```

**戻り値**: `ApiResult<Chapter>`

### 4. 章削除

#### `delete-chapter`

**説明**: 章を削除

**パラメータ**: `chapterId: string`

**戻り値**: `ApiResult`

**制限**:

- デフォルト章（order: 0）は削除不可
- 関連するプレイセッションは「その他」に移動

### 5. 章順序更新

#### `update-chapters-order`

**説明**: 複数章の順序を一括更新

**パラメータ**: `Array<{ id: string; order: number }>`

**戻り値**: `ApiResult`

**呼び出し例**:

```typescript
const result = await window.api.chapter.updateChaptersOrder([
  { id: "chapter1", order: 1 },
  { id: "chapter2", order: 2 }
])
```

### 6. 現在章設定

#### `set-current-chapter`

**説明**: ゲームの現在プレイ中の章を設定

**パラメータ**:

- `gameId: string`
- `chapterId: string | null`

**戻り値**: `ApiResult`

### 7. 章別統計取得

#### `get-chapter-stats`

**説明**: 章別のプレイ統計を取得

**パラメータ**: `gameId: string`

**戻り値**: `ApiResult<ChapterStats[]>`

```typescript
interface ChapterStats {
  chapterId: string
  chapterName: string
  totalTime: number
  sessionCount: number
  averageTime: number
  order: number
}
```

## プレイセッション管理API

### 1. プレイセッション一覧取得

#### `get-play-sessions`

**説明**: 指定ゲームのプレイセッション一覧を取得

**パラメータ**: `gameId: string`

**戻り値**: `ApiResult<PlaySessionType[]>`

```typescript
interface PlaySessionType {
  id: string
  sessionName?: string
  playedAt: Date
  duration: number
  gameId: string
  chapterId: string | null
  chapter?: {
    name: string
    id: string
    order: number
  }
}
```

### 2. プレイセッション作成

#### `create-play-session`

**説明**: 手動でプレイセッションを作成

**パラメータ**: `PlaySessionCreateInput`

```typescript
interface PlaySessionCreateInput {
  sessionName?: string
  duration: number
  gameId: string
  chapterId?: string
  playedAt?: Date
}
```

**戻り値**: `ApiResult<PlaySessionType>`

### 3. プレイセッション更新

#### `update-play-session`

**説明**: プレイセッションの情報を更新

**パラメータ**:

- `sessionId: string`
- `updateData: PlaySessionUpdateInput`

```typescript
interface PlaySessionUpdateInput {
  sessionName?: string
  duration?: number
  chapterId?: string
  playedAt?: Date
}
```

**戻り値**: `ApiResult<PlaySessionType>`

### 4. プレイセッション削除

#### `delete-play-session`

**説明**: プレイセッションを削除

**パラメータ**: `sessionId: string`

**戻り値**: `ApiResult`

**副作用**:

- ゲームの総プレイ時間から削除されたセッション時間を減算

## プロセス監視API

### 1. 監視開始

#### `start-monitoring`

**説明**: プロセス監視を開始

**パラメータ**: なし

**戻り値**: `ApiResult`

**処理内容**:

- 2秒間隔でプロセス監視開始
- データベースからゲーム情報を読み込み
- 自動監視対象追加機能を有効化

### 2. 監視停止

#### `stop-monitoring`

**説明**: プロセス監視を停止

**パラメータ**: なし

**戻り値**: `ApiResult`

**処理内容**:

- 進行中のセッションを保存
- 監視タイマーを停止
- メモリキャッシュをクリア

### 3. 監視状況取得

#### `get-monitoring-status`

**説明**: 現在の監視状況を取得

**パラメータ**: なし

**戻り値**: `ApiResult<MonitoringGameStatus[]>`

```typescript
interface MonitoringGameStatus {
  gameId: string
  gameTitle: string
  exeName: string
  isPlaying: boolean
  playTime: number
}
```

### 4. ゲーム監視追加

#### `add-game-to-monitor`

**説明**: 特定のゲームを監視対象に追加

**パラメータ**:

- `gameId: string`
- `gameTitle: string`
- `exePath: string`

**戻り値**: `ApiResult`

### 5. ゲーム監視削除

#### `remove-game-from-monitor`

**説明**: 特定のゲームを監視対象から削除

**パラメータ**: `gameId: string`

**戻り値**: `ApiResult`

**処理内容**:

- 進行中のセッションがあれば保存
- 監視対象リストから削除

## クラウド同期API

### 1. クラウドデータ一覧取得

#### `cloud-data-list`

**説明**: クラウド上のゲームデータ一覧を取得

**パラメータ**: なし

**戻り値**: `ApiResult<CloudDataItem[]>`

```typescript
interface CloudDataItem {
  name: string
  totalSize: number
  fileCount: number
  lastModified: Date
  remotePath: string
}
```

### 2. セーブデータアップロード

#### `upload-save-data`

**説明**: セーブデータをクラウドにアップロード

**パラメータ**: `UploadSaveDataInput`

```typescript
interface UploadSaveDataInput {
  gameId: string
  localPath: string
  remotePath: string
  comment?: string
}
```

**戻り値**: `ApiResult<UploadResult>`

```typescript
interface UploadResult {
  uploadId: string
  uploadedFiles: number
  totalSize: number
  duration: number
}
```

### 3. セーブデータダウンロード

#### `download-save-data`

**説明**: クラウドからセーブデータをダウンロード

**パラメータ**: `DownloadSaveDataInput`

```typescript
interface DownloadSaveDataInput {
  remotePath: string
  localPath: string
  overwrite?: boolean
}
```

**戻り値**: `ApiResult<DownloadResult>`

```typescript
interface DownloadResult {
  downloadedFiles: number
  totalSize: number
  duration: number
}
```

### 4. クラウドデータ削除

#### `cloud-data-delete`

**説明**: クラウド上のデータを削除

**パラメータ**: `remotePath: string`

**戻り値**: `ApiResult`

### 5. ディレクトリツリー取得

#### `cloud-data-get-directory-tree`

**説明**: クラウドの階層構造をツリー形式で取得

**パラメータ**: なし

**戻り値**: `ApiResult<CloudDirectoryNode[]>`

```typescript
interface CloudDirectoryNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  lastModified: Date
  children?: CloudDirectoryNode[]
  objectKey?: string
}
```

## 認証情報管理API

### 1. 認証情報設定

#### `set-credentials`

**説明**: R2/S3の認証情報を設定

**パラメータ**: `R2Credentials`

```typescript
interface R2Credentials {
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  region: string
  endpoint: string
}
```

**戻り値**: `ApiResult`

**セキュリティ**:

- OSキーチェーンに暗号化保存
- メモリ上での平文保持時間を最小化

### 2. 認証情報取得

#### `get-credentials`

**説明**: 保存された認証情報を取得

**パラメータ**: なし

**戻り値**: `ApiResult<R2Credentials | null>`

**注意**: secretAccessKeyは取得時にマスクされます

### 3. 認証情報検証

#### `validate-credentials`

**説明**: 認証情報の有効性を検証

**パラメータ**: なし

**戻り値**: `ApiResult<boolean>`

**検証内容**:

- S3/R2接続テスト
- バケットアクセス権限確認
- エンドポイント有効性確認

### 4. 認証情報削除

#### `delete-credentials`

**説明**: 保存された認証情報を削除

**パラメータ**: なし

**戻り値**: `ApiResult`

## ファイル操作API

### 1. ファイル選択ダイアログ

#### `show-open-dialog`

**説明**: ファイル選択ダイアログを表示

**パラメータ**: `OpenDialogOptions`

```typescript
interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
  properties?: ("openFile" | "openDirectory" | "multiSelections")[]
}

interface FileFilter {
  name: string
  extensions: string[]
}
```

**戻り値**: `ApiResult<string[]>`

**呼び出し例**:

```typescript
const result = await window.api.file.showOpenDialog({
  title: "実行ファイルを選択",
  filters: [
    { name: "実行ファイル", extensions: ["exe"] },
    { name: "すべてのファイル", extensions: ["*"] }
  ],
  properties: ["openFile"]
})
```

### 2. ファイル存在確認

#### `file-exists`

**説明**: ファイルの存在を確認

**パラメータ**: `filePath: string`

**戻り値**: `ApiResult<boolean>`

### 3. ディレクトリ作成

#### `create-directory`

**説明**: ディレクトリを作成

**パラメータ**: `dirPath: string`

**戻り値**: `ApiResult`

### 4. パス解決

#### `resolve-path`

**説明**: 相対パスを絶対パスに解決

**パラメータ**: `relativePath: string`

**戻り値**: `ApiResult<string>`

### 5. 画像読み込み

#### `load-image`

**説明**: 画像ファイルをBase64形式で読み込み

**パラメータ**: `imagePath: string`

**戻り値**: `ApiResult<string>`

**サポート形式**: PNG, JPEG, GIF, WebP

## 設定管理API

### 1. 設定取得

#### `get-setting`

**説明**: 指定キーの設定値を取得

**パラメータ**:

- `key: string`
- `defaultValue?: unknown`

**戻り値**: `ApiResult<unknown>`

### 2. 設定保存

#### `set-setting`

**説明**: 設定値を保存

**パラメータ**:

- `key: string`
- `value: unknown`

**戻り値**: `ApiResult`

### 3. 設定削除

#### `delete-setting`

**説明**: 設定値を削除

**パラメータ**: `key: string`

**戻り値**: `ApiResult`

### 4. テーマ設定

#### `set-theme`

**説明**: アプリケーションテーマを設定

**パラメータ**: `theme: 'light' | 'dark' | 'system'`

**戻り値**: `ApiResult`

### 5. 自動計測設定

#### `set-auto-tracking`

**説明**: 自動プレイ時間計測の有効/無効を設定

**パラメータ**: `enabled: boolean`

**戻り値**: `ApiResult`

## エラーハンドリング

### エラー分類

#### 1. バリデーションエラー

```typescript
{
  success: false,
  message: "タイトルは必須です"
}
```

#### 2. システムエラー

```typescript
{
  success: false,
  message: "データベースアクセスに失敗しました"
}
```

#### 3. 外部サービスエラー

```typescript
{
  success: false,
  message: "クラウドストレージへの接続に失敗しました"
}
```

### エラーレスポンス例

```typescript
// ファイルが見つからない場合
{
  success: false,
  message: "指定されたファイルが見つかりません: C:/game.exe"
}

// 権限エラー
{
  success: false,
  message: "ファイルへのアクセス権限がありません"
}

// ネットワークエラー
{
  success: false,
  message: "ネットワーク接続を確認してください"
}

// 認証エラー
{
  success: false,
  message: "認証情報が正しくありません"
}
```

### エラー処理のベストプラクティス

#### フロントエンド側

```typescript
const result = await window.api.game.createGame(gameData)
if (!result.success) {
  // エラーハンドリング
  toast.error(result.message)
  return
}

// 成功時の処理
const newGame = result.data
```

#### バックエンド側

```typescript
export const createGame = async (gameData: InputGameData): Promise<ApiResult<GameType>> => {
  try {
    // バリデーション
    const validation = validateGameData(gameData)
    if (!validation.isValid) {
      return { success: false, message: validation.message }
    }

    // 処理実行
    const game = await prisma.game.create({ data: gameData })
    return { success: true, data: game }
  } catch (error) {
    logger.error("ゲーム作成エラー:", error)
    return { success: false, message: "ゲームの作成に失敗しました" }
  }
}
```

## API使用例

### 基本的な使用パターン

#### 1. ゲーム登録フロー

```typescript
// 1. ファイル選択
const fileResult = await window.api.file.showOpenDialog({
  title: "実行ファイルを選択",
  filters: [{ name: "実行ファイル", extensions: ["exe"] }],
  properties: ["openFile"]
})

if (!fileResult.success || !fileResult.data?.[0]) {
  return
}

// 2. ゲーム作成
const gameData: InputGameData = {
  title: "新しいゲーム",
  publisher: "出版社",
  exePath: fileResult.data[0],
  playStatus: "UNPLAYED"
}

const createResult = await window.api.game.createGame(gameData)
if (createResult.success) {
  toast.success("ゲームが登録されました")
  // UI更新
  refreshGameList()
}
```

#### 2. クラウド同期フロー

```typescript
// 1. 認証情報確認
const credResult = await window.api.credentials.validateCredentials()
if (!credResult.success) {
  toast.error("認証情報を設定してください")
  return
}

// 2. アップロード実行
const uploadResult = await window.api.cloud.uploadSaveData({
  gameId: "game-uuid",
  localPath: "C:/SaveData",
  remotePath: "game-save",
  comment: "プレイ前のバックアップ"
})

if (uploadResult.success) {
  toast.success(`${uploadResult.data.uploadedFiles}件のファイルをアップロードしました`)
}
```

## パフォーマンス考慮事項

### 1. 大量データの処理

- ページネーション実装（必要に応じて）
- 仮想化による表示最適化
- キャッシュ機能の活用

### 2. ファイル操作の最適化

- ストリーミング処理
- チャンク分割アップロード
- 並列処理による高速化

### 3. メモリ管理

- 大きなデータの適切な解放
- イベントリスナーのクリーンアップ
- 不要なキャッシュの削除

## セキュリティ考慮事項

### 1. 入力値検証

- すべての入力値をサニタイズ
- パストラバーサル攻撃対策
- ファイルタイプ検証

### 2. 認証情報保護

- OSキーチェーンでの暗号化保存
- メモリ上での最小限保持
- ログ出力時のマスク処理

### 3. プロセス分離

- Context Isolationの活用
- 最小権限の原則
- 安全なIPC通信

## まとめ

このAPI仕様書は、CloudLaunchのすべてのIPC通信インターフェースを定義しています。新機能追加や既存機能の変更を行う際は、この仕様に従って実装してください。

API変更時は以下の点に注意してください：

- 後方互換性の維持
- 適切なバージョニング
- 十分なテストカバレッジ
- ドキュメントの更新
