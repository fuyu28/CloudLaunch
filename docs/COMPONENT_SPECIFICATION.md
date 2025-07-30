# CloudLaunch コンポーネント仕様書

## 目次

1. [概要](#概要)
2. [コンポーネント設計原則](#コンポーネント設計原則)
3. [ページコンポーネント](#ページコンポーネント)
4. [UIコンポーネント](#UIコンポーネント)
5. [モーダルコンポーネント](#モーダルコンポーネント)
6. [フォームコンポーネント](#フォームコンポーネント)
7. [カスタムフック](#カスタムフック)
8. [状態管理](#状態管理)
9. [スタイリング](#スタイリング)
10. [テスト](#テスト)

## 概要

CloudLaunchのフロントエンドは、React 19を基盤とした再利用可能なコンポーネントシステムで構築されています。TypeScriptによる型安全性、Tailwind CSSによるスタイリング、Jotaiによる状態管理を採用しています。

## コンポーネント設計原則

### 1. 単一責任の原則

各コンポーネントは一つの責任のみを持つ

### 2. 再利用性

共通機能は再利用可能なコンポーネントとして抽出

### 3. 型安全性

すべてのPropsとStateに厳密な型定義

### 4. パフォーマンス最適化

React.memo、useMemo、useCallbackの適切な使用

### 5. アクセシビリティ

WCAG 2.1 AA基準への準拠

## ページコンポーネント

### 1. Home (`src/renderer/src/pages/Home.tsx`)

#### 概要

ゲーム一覧の表示とゲーム管理機能を提供するメインページ

#### 機能

- ゲーム一覧表示
- 検索・フィルタリング
- ゲーム追加・編集・削除
- プレイステータス更新

#### Props

```typescript
// ページコンポーネントのため、Propsなし
```

#### 状態管理

```typescript
// Jotai atoms
const [games, setGames] = useAtom(gamesAtom)
const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
const [playStatusFilter, setPlayStatusFilter] = useAtom(playStatusFilterAtom)
const [sortBy, setSortBy] = useAtom(sortByAtom)
```

#### 使用コンポーネント

- `GameCard`: ゲーム情報表示
- `GameModal`: ゲーム追加・編集
- `FloatingButton`: ゲーム追加ボタン

#### レイアウト構造

```tsx
<MainLayout>
  <header>
    <SearchBar />
    <FilterControls />
  </header>
  <main>
    <GameGrid>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </GameGrid>
  </main>
  <FloatingButton onClick={openAddModal} />
  <GameModal isOpen={isModalOpen} onClose={closeModal} />
</MainLayout>
```

### 2. GameDetail (`src/renderer/src/pages/GameDetail.tsx`)

#### 概要

個別ゲームの詳細情報とプレイ管理機能

#### 機能

- ゲーム詳細情報表示
- プレイセッション管理
- 章別進捗表示
- セーブデータ管理

#### Props

```typescript
interface GameDetailProps {
  // React Router経由でパラメータを取得
}
```

#### URL パラメータ

- `gameId`: ゲームの一意識別子

#### レイアウト構造

```tsx
<div className="bg-base-200 px-6 py-4">
  <button onClick={handleBack} className="btn btn-ghost mb-4">
    <FaArrowLeftLong />
    戻る
  </button>

  {/* 上段：ゲーム情報カード */}
  <div className="mb-3">
    <GameInfo
      game={game}
      isUpdatingStatus={isUpdatingStatus}
      isLaunching={isLaunching}
      onStatusChange={handleStatusChange}
      onLaunchGame={handleLaunchGame}
      onEditGame={openEdit}
      onDeleteGame={openDelete}
    />
  </div>

  {/* 中段：プレイ統計（統合コンポーネント） */}
  <div className="mb-4">
    <PlayStatistics
      game={game}
      refreshKey={refreshKey}
      onAddPlaySession={handleOpenPlaySessionModal}
      onOpenProcessManagement={() => setIsProcessModalOpen(true)}
    />
  </div>

  {/* 下段：その他の管理機能 */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <ChapterDisplayCard />
    <CloudDataCard />
    <MemoCard />
  </div>
</div>
```

#### レイアウト変更履歴

- **2024年版**: 4段階レイアウト（ゲーム情報 → プレイセッション → 章別統計 → その他機能）
- **現在版**: 3段階レイアウト（ゲーム情報 → プレイ統計統合 → その他管理機能）

### 3. Cloud (`src/renderer/src/pages/Cloud.tsx`)

#### 概要

クラウドデータの管理とセーブデータ同期機能

#### 機能

- クラウドデータ一覧表示
- ファイルアップロード・ダウンロード
- ディレクトリツリー表示
- データ削除機能

#### 状態管理

```typescript
const [cloudData, setCloudData] = useState<CloudDataItem[]>([])
const [selectedNode, setSelectedNode] = useState<CloudDirectoryNode | null>(null)
const [isUploading, setIsUploading] = useState(false)
```

### 4. MemoList (`src/renderer/src/pages/MemoList.tsx`)

#### 概要

ゲーム別メモ一覧の表示と管理機能

#### 機能

- ゲーム別メモ一覧表示
- メモ検索・フィルタリング
- メモ作成・編集・削除
- クラウド同期機能

#### Props

```typescript
// ページコンポーネントのため、React Routerからパラメータを取得
```

#### URL パラメータ

- `gameId`: ゲームの一意識別子

#### 状態管理

```typescript
const [memos, setMemos] = useState<MemoType[]>([])
const [searchQuery, setSearchQuery] = useState("")
const [isLoading, setIsLoading] = useState(false)
```

### 5. MemoCreate (`src/renderer/src/pages/MemoCreate.tsx`)

#### 概要

新規メモ作成ページ

#### 機能

- Markdownエディタによるメモ作成
- リアルタイムプレビュー
- ゲーム選択機能
- 自動保存機能

#### 状態管理

```typescript
const [title, setTitle] = useState("")
const [content, setContent] = useState("")
const [selectedGameId, setSelectedGameId] = useState<string>("")
```

### 6. MemoEditor (`src/renderer/src/pages/MemoEditor.tsx`)

#### 概要

既存メモ編集ページ

#### 機能

- Markdownエディタによるメモ編集
- リアルタイムプレビュー
- 変更検出・保存確認
- クラウド同期

#### URL パラメータ

- `memoId`: メモの一意識別子

### 7. MemoView (`src/renderer/src/pages/MemoView.tsx`)

#### 概要

メモ表示・読み込み専用ページ

#### 機能

- Markdownレンダリング表示
- 印刷機能
- エクスポート機能
- 編集モードへの切り替え

### 4. Settings (`src/renderer/src/pages/Settings.tsx`)

#### 概要

アプリケーション設定とクラウド認証情報管理

#### 機能

- R2/S3認証情報設定
- アプリケーション設定
- テーマ切り替え
- 自動計測設定

#### レイアウト構造

```tsx
<MainLayout>
  <SettingsNavigation>
    <SettingsPanel name="general">
      <GeneralSettings />
    </SettingsPanel>
    <SettingsPanel name="cloud">
      <R2S3Settings />
    </SettingsPanel>
  </SettingsNavigation>
</MainLayout>
```

### 8. Settings (`src/renderer/src/pages/Settings.tsx`)

#### 機能更新

**新機能**:

- メモディレクトリ設定
- メモ同期設定
- エディタ設定（テーマ、フォントサイズ等）

## UIコンポーネント

### 1. GameCard (`src/renderer/src/components/GameCard.tsx`)

#### 概要

ゲーム情報を表示するカードコンポーネント

#### Props

```typescript
interface GameCardProps {
  /** ゲーム情報 */
  game: GameType
  /** クリック時のコールバック */
  onClick?: (game: GameType) => void
  /** 編集ボタンクリック時のコールバック */
  onEdit?: (game: GameType) => void
  /** 削除ボタンクリック時のコールバック */
  onDelete?: (game: GameType) => void
}
```

#### 表示項目

- ゲーム画像（DynamicImageコンポーネント使用）
- タイトル
- 出版社
- プレイステータス
- 総プレイ時間
- 最終プレイ日時

#### インタラクション

- カードクリック → ゲーム詳細画面へ遷移
- 編集ボタン → ゲーム編集モーダル表示
- 削除ボタン → 削除確認モーダル表示

### 2. DynamicImage (`src/renderer/src/components/DynamicImage.tsx`)

#### 概要

画像の動的読み込みとフォールバック表示

#### Props

```typescript
interface DynamicImageProps {
  /** 画像のパス */
  src?: string
  /** 代替テキスト */
  alt: string
  /** CSSクラス名 */
  className?: string
  /** フォールバック画像のパス */
  fallback?: string
}
```

#### 機能

- 遅延読み込み（Intersection Observer）
- エラー時のフォールバック表示
- ローディング状態の表示

#### 使用例

```tsx
<DynamicImage
  src={game.imagePath}
  alt={game.title}
  className="w-full h-48 object-cover"
  fallback="/default-game-image.png"
/>
```

### 3. PlayStatusSelector (`src/renderer/src/components/PlayStatusSelector.tsx`)

#### 概要

プレイステータス選択用のセレクトボックス

#### Props

```typescript
interface PlayStatusSelectorProps {
  /** 現在の値 */
  value: PlayStatus
  /** 値変更時のコールバック */
  onChange: (status: PlayStatus) => void
  /** 無効化フラグ */
  disabled?: boolean
  /** サイズ */
  size?: "sm" | "md" | "lg"
}
```

#### オプション

```typescript
const statusOptions = [
  { value: "UNPLAYED", label: "未プレイ", color: "text-gray-500" },
  { value: "PLAYING", label: "プレイ中", color: "text-blue-500" },
  { value: "COMPLETED", label: "クリア済み", color: "text-green-500" }
]
```

### 4. FileSelectButton (`src/renderer/src/components/FileSelectButton.tsx`)

#### 概要

ファイル選択ダイアログを開くボタン

#### Props

```typescript
interface FileSelectButtonProps {
  /** ボタンテキスト */
  children: React.ReactNode
  /** ファイル選択時のコールバック */
  onFileSelect: (filePath: string) => void
  /** ダイアログオプション */
  dialogOptions?: OpenDialogOptions
  /** ボタンのバリアント */
  variant?: "primary" | "secondary" | "outline"
  /** 無効化フラグ */
  disabled?: boolean
}
```

#### 使用例

```tsx
<FileSelectButton
  onFileSelect={setExePath}
  dialogOptions={{
    title: "実行ファイルを選択",
    filters: [{ name: "実行ファイル", extensions: ["exe"] }]
  }}
  variant="outline"
>
  ファイルを選択
</FileSelectButton>
```

### 5. PlayStatistics (`src/renderer/src/components/PlayStatistics.tsx`)

#### 概要

プレイセッション管理と章別プレイ統計を統合したコンポーネント

#### Props

```typescript
interface PlayStatisticsProps {
  /** ゲーム情報 */
  game: GameType
  /** 更新キー（データ再取得トリガー） */
  refreshKey: number
  /** プレイセッション追加ハンドラ */
  onAddPlaySession: () => void
  /** プロセス管理モーダル開く */
  onOpenProcessManagement: () => void
}
```

#### 機能

- プレイセッション統計表示（PlaySessionCardSimple使用）
- 章別プレイ統計グラフ（ChapterBarChart使用）
- セッション管理ボタンの統一配置
- カード形式での明確な境界表示

#### 構造

```tsx
<div className="card bg-base-100 shadow-xl">
  <div className="card-body pb-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-primary rounded-full"></div>
        <h2 className="card-title text-xl">プレイ統計</h2>
      </div>
      {/* セッション管理ボタン */}
      <div className="flex gap-2">
        <button className="btn btn-outline btn-sm">管理</button>
        <button className="btn btn-primary btn-sm">追加</button>
      </div>
    </div>

    <div className="space-y-4">
      {/* プレイセッション統計 */}
      <PlaySessionCardSimple hiddenButtons={true} />

      {/* 章別プレイ統計グラフ */}
      <ChapterBarChart />
    </div>
  </div>
</div>
```

#### スタイリング特徴

- PlaySessionCardSimple: `border-2 border-accent/30` (アクセント色のoutline)
- ChapterBarChart: `border-2 border-secondary/30` (セカンダリ色のoutline)
- 統一されたカードデザインで視覚的な区別を実現

### 6. PlaySessionCardSimple (`src/renderer/src/components/PlaySessionCardSimple.tsx`)

#### 概要

プレイ統計セクション用に簡略化されたプレイセッション表示コンポーネント

#### Props

```typescript
interface PlaySessionCardSimpleProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
  /** プレイセッション追加のコールバック */
  onAddSession?: () => void
  /** セッション更新時のコールバック */
  onSessionUpdated?: () => void
  /** プロセス管理を開くコールバック */
  onProcessManagement?: () => void
  /** ボタンを非表示にするフラグ */
  hiddenButtons?: boolean
}
```

#### 機能

- プレイセッション統計の4項目表示
  - 総セッション数
  - 総プレイ時間
  - 平均プレイ時間
  - 今週のプレイ時間
- 条件付きボタン表示（hiddenButtonsプロパティ）
- アクセント色のカードoutline

### 7. ChapterBarChart (`src/renderer/src/components/ChapterBarChart.tsx`)

#### 概要

章別プレイ統計を表示する棒グラフコンポーネント（PlayStatistics統合用に更新）

#### Props

```typescript
interface ChapterBarChartProps {
  /** ゲームID */
  gameId: string
  /** ゲームタイトル */
  gameTitle: string
}
```

#### 機能

- 章別プレイ時間の割合をグラデーション棒グラフで表示
- 各章の詳細情報（時間・割合）をリスト表示
- セカンダリ色のカードoutline

#### 構造

```tsx
<div className="card bg-base-100 border-2 border-secondary/30 shadow-sm">
  <div className="card-body p-4">
    {/* 単一の棒グラフ */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">総プレイ時間の章別割合</span>
        <span className="text-sm text-base-content/60">{totalTime}</span>
      </div>
      <div className="w-full h-8 rounded-full overflow-hidden bg-base-300" />
    </div>

    {/* 章別詳細情報 */}
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-base-content/80 mb-3">章別詳細</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {/* 章リスト */}
      </div>
    </div>
  </div>
</div>
```

#### スタイリング変更点

- **以前**: `shadow-xl` の大きなシャドウ
- **現在**: `border-2 border-secondary/30 shadow-sm` のoutlineスタイル
- **パディング**: `card-body` から `card-body p-4` に統一

### 8. CloudTreeNode (`src/renderer/src/components/CloudTreeNode.tsx`)

#### 概要

クラウドディレクトリツリー表示用のノードコンポーネント

#### Props

```typescript
interface CloudTreeNodeProps {
  /** ディレクトリノード */
  node: CloudDirectoryNode
  /** ノード選択時のコールバック */
  onNodeSelect: (node: CloudDirectoryNode) => void
  /** 展開状態 */
  isExpanded?: boolean
  /** 選択状態 */
  isSelected?: boolean
  /** インデントレベル */
  level?: number
}
```

#### 機能

- 階層構造の表示
- 展開・折りたたみ
- ファイル・フォルダアイコン
- 選択状態の視覚表現

### 9. CloudItemCard (`src/renderer/src/components/CloudItemCard.tsx`)

#### 概要

クラウドアイテム表示用のカードコンポーネント

#### Props

```typescript
interface CloudItemCardProps {
  /** クラウドデータアイテム */
  item: CloudDataItem
  /** アイテム選択時のコールバック */
  onSelect: (item: CloudDataItem) => void
  /** ダウンロード開始時のコールバック */
  onDownload: (item: CloudDataItem) => void
  /** 削除時のコールバック */
  onDelete: (item: CloudDataItem) => void
}
```

#### 機能

- アイテム情報表示（サイズ、更新日時等）
- アクションボタン（ダウンロード、削除）
- プログレスインジケーター

### 10. CloudHeader (`src/renderer/src/components/CloudHeader.tsx`)

#### 概要

クラウドページのヘッダーコンポーネント

#### Props

```typescript
interface CloudHeaderProps {
  /** 現在のパス */
  currentPath: string
  /** パス変更時のコールバック */
  onPathChange: (path: string) => void
  /** リフレッシュ時のコールバック */
  onRefresh: () => void
  /** アップロード開始時のコールバック */
  onUpload: () => void
}
```

#### 機能

- パンくずナビゲーション
- リフレッシュボタン
- アップロードボタン
- 接続状態表示

### 11. ConfirmModal (`src/renderer/src/components/ConfirmModal.tsx`)

#### 概要

汎用確認ダイアログコンポーネント

#### Props

```typescript
interface ConfirmModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** タイトル */
  title: string
  /** 確認メッセージ */
  message: string
  /** 確認ボタンテキスト */
  confirmText?: string
  /** キャンセルボタンテキスト */
  cancelText?: string
  /** 確認ボタンの種類 */
  confirmVariant?: "primary" | "danger" | "warning"
  /** 確認時のコールバック */
  onConfirm: () => void
  /** キャンセル時のコールバック */
  onCancel: () => void
}
```

#### 機能

- 危険な操作の確認
- カスタマイズ可能なボタン
- アクセシビリティ対応

### 12. DynamicImage (`src/renderer/src/components/DynamicImage.tsx`)

#### 概要

動的画像読み込みコンポーネント

#### Props

```typescript
interface DynamicImageProps {
  /** 画像パス */
  src?: string
  /** 代替テキスト */
  alt: string
  /** CSSクラス */
  className?: string
  /** フォールバック画像 */
  fallback?: string
  /** 遅延読み込み */
  lazy?: boolean
}
```

#### 機能

- Intersection Observerによる遅延読み込み
- エラー時のフォールバック
- ローディング状態表示
- メモリキャッシュ

## モーダルコンポーネント

### 1. BaseModal (`src/renderer/src/components/BaseModal.tsx`)

#### 概要

すべてのモーダルの基底クラス

#### Props

```typescript
interface BaseModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** モーダルのタイトル */
  title?: string
  /** モーダルのサイズ */
  size?: "sm" | "md" | "lg" | "xl" | "full"
  /** 背景クリックで閉じるかどうか */
  closeOnBackdrop?: boolean
  /** ESCキーで閉じるかどうか */
  closeOnEscape?: boolean
  /** 子要素 */
  children: React.ReactNode
}
```

#### 機能

- フォーカストラップ
- ESCキーでの閉じる機能
- 背景クリックでの閉じる機能
- アニメーション（enter/exit）

### 2. GameModal (`src/renderer/src/components/GameModal.tsx`)

#### 概要

ゲーム追加・編集用のモーダル

#### Props

```typescript
interface GameModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** 編集対象のゲーム（新規作成時はundefined） */
  game?: GameType
  /** モーダルを閉じる際のコールバック */
  onClose: () => void
  /** ゲームが追加・更新された際のコールバック */
  onGameSaved?: (game: GameType) => void
}
```

#### フォーム項目

- タイトル（必須）
- 出版社（必須）
- 実行ファイルパス（必須）
- セーブフォルダパス（任意）
- 画像パス（任意）
- プレイステータス

#### バリデーション

```typescript
const validation = {
  title: (value: string) => ({
    isValid: value.trim().length > 0,
    message: "タイトルは必須です"
  }),
  publisher: (value: string) => ({
    isValid: value.trim().length > 0,
    message: "出版社は必須です"
  }),
  exePath: (value: string) => ({
    isValid: value.trim().length > 0,
    message: "実行ファイルパスは必須です"
  })
}
```

### 3. ConfirmModal (`src/renderer/src/components/ConfirmModal.tsx`)

#### 概要

確認ダイアログ用のモーダル

#### Props

```typescript
interface ConfirmModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** モーダルのタイトル */
  title: string
  /** 確認メッセージ */
  message: string
  /** 確認ボタンのテキスト */
  confirmText?: string
  /** キャンセルボタンのテキスト */
  cancelText?: string
  /** 確認ボタンのバリアント */
  confirmVariant?: "primary" | "danger"
  /** 確認時のコールバック */
  onConfirm: () => void
  /** キャンセル時のコールバック */
  onCancel: () => void
}
```

#### 使用例

```tsx
<ConfirmModal
  isOpen={isDeleteModalOpen}
  title="ゲーム削除"
  message={`「${selectedGame?.title}」を削除してもよろしいですか？`}
  confirmText="削除"
  confirmVariant="danger"
  onConfirm={handleDeleteConfirm}
  onCancel={() => setIsDeleteModalOpen(false)}
/>
```

## フォームコンポーネント

### 1. GameFormFields (`src/renderer/src/components/GameFormFields.tsx`)

#### 概要

ゲーム情報入力用のフォームフィールド群

#### Props

```typescript
interface GameFormFieldsProps {
  /** フォームデータ */
  formData: GameFormData
  /** フォームデータ変更時のコールバック */
  onChange: (data: Partial<GameFormData>) => void
  /** バリデーションエラー */
  errors?: GameFormValidationErrors
  /** 無効化フラグ */
  disabled?: boolean
}

interface GameFormData {
  title: string
  publisher: string
  exePath: string
  saveFolderPath: string
  imagePath: string
  playStatus: PlayStatus
}
```

#### フィールド構成

```tsx
<div className="space-y-4">
  <TextInput
    label="タイトル"
    value={formData.title}
    onChange={(value) => onChange({ title: value })}
    error={errors?.title}
    required
  />
  <TextInput
    label="出版社"
    value={formData.publisher}
    onChange={(value) => onChange({ publisher: value })}
    error={errors?.publisher}
    required
  />
  <FileSelectInput
    label="実行ファイル"
    value={formData.exePath}
    onChange={(value) => onChange({ exePath: value })}
    error={errors?.exePath}
    filters={[{ name: "実行ファイル", extensions: ["exe"] }]}
    required
  />
  {/* 他のフィールド */}
</div>
```

### 2. SettingsFormField (`src/renderer/src/components/SettingsFormField.tsx`)

#### 概要

設定用のフォームフィールド（汎用）

#### Props

```typescript
interface SettingsFormFieldProps {
  /** フィールドのタイプ */
  type: "text" | "password" | "select" | "checkbox" | "textarea"
  /** ラベル */
  label: string
  /** 値 */
  value: string | boolean
  /** 値変更時のコールバック */
  onChange: (value: string | boolean) => void
  /** プレースホルダー */
  placeholder?: string
  /** 必須フラグ */
  required?: boolean
  /** 無効化フラグ */
  disabled?: boolean
  /** エラーメッセージ */
  error?: string
  /** ヘルプテキスト */
  help?: string
  /** セレクトボックスのオプション */
  options?: SelectOption[]
}
```

## カスタムフック

### 1. useGameActions (`src/renderer/src/hooks/useGameActions.ts`)

#### 概要

ゲーム操作（作成、更新、削除）の共通ロジック

#### 返り値

```typescript
interface UseGameActionsReturn {
  /** ゲーム作成 */
  createGame: (data: InputGameData) => Promise<ApiResult<GameType>>
  /** ゲーム更新 */
  updateGame: (id: string, data: Partial<InputGameData>) => Promise<ApiResult<GameType>>
  /** ゲーム削除 */
  deleteGame: (id: string) => Promise<ApiResult>
  /** ローディング状態 */
  isLoading: boolean
  /** エラー状態 */
  error: string | undefined
}
```

#### 使用例

```tsx
const GameList: React.FC = () => {
  const { createGame, updateGame, deleteGame, isLoading } = useGameActions()

  const handleCreate = async (data: InputGameData) => {
    const result = await createGame(data)
    if (result.success) {
      toast.success("ゲームを作成しました")
      refreshGameList()
    }
  }

  return <div>{/* UI components */}</div>
}
```

### 2. useLoadingState (`src/renderer/src/hooks/useLoadingState.ts`)

#### 概要

ローディング状態とエラー状態の管理

#### 返り値

```typescript
interface UseLoadingStateReturn {
  /** ローディング中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | undefined
  /** ローディング状態を設定 */
  setLoading: (loading: boolean) => void
  /** エラー状態を設定 */
  setError: (error: string | undefined) => void
  /** 状態をリセット */
  reset: () => void
  /** トースト付きで非同期処理を実行 */
  executeWithLoading: <T>(
    asyncFn: () => Promise<T>,
    options?: ToastOptions
  ) => Promise<T | undefined>
}
```

### 3. useToastHandler (`src/renderer/src/hooks/useToastHandler.ts`)

#### 概要

トースト通知の統一管理

#### 返り値

```typescript
interface UseToastHandlerReturn {
  /** 成功トースト */
  showSuccess: (message: string, options?: ToastOptions) => void
  /** エラートースト */
  showError: (message: string, options?: ToastOptions) => void
  /** 警告トースト */
  showWarning: (message: string, options?: ToastOptions) => void
  /** 情報トースト */
  showInfo: (message: string, options?: ToastOptions) => void
  /** ローディングトースト */
  showLoading: (message: string) => string
  /** トースト更新 */
  updateToast: (id: string, message: string, type: ToastType) => void
  /** トースト削除 */
  dismissToast: (id: string) => void
}
```

### 4. useDebounce (`src/renderer/src/hooks/useDebounce.ts`)

#### 概要

値の変更をデバウンスする

#### パラメータ・返り値

```typescript
function useDebounce<T>(value: T, delay: number): T
```

#### 使用例

```tsx
const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="ゲームを検索..."
    />
  )
}
```

### 5. useTheme (`src/renderer/src/hooks/useTheme.ts`)

#### 概要

テーマ切り替えの管理

#### 返り値

```typescript
interface UseThemeReturn {
  /** 現在のテーマ */
  theme: Theme
  /** テーマを設定 */
  setTheme: (theme: Theme) => Promise<void>
  /** システムテーマ */
  systemTheme: "light" | "dark"
  /** 実際に適用されているテーマ */
  resolvedTheme: "light" | "dark"
}

type Theme = "light" | "dark" | "system"
```

## 状態管理

### 1. Jotai Atoms

#### gamesAtom (`src/renderer/src/state/home.ts`)

```typescript
export const gamesAtom = atom<GameType[]>([])
export const searchQueryAtom = atom<string>("")
export const playStatusFilterAtom = atom<PlayStatus | "ALL">("ALL")
export const sortByAtom = atom<GameSortOption>("lastPlayed")
```

#### credentialsAtom (`src/renderer/src/state/credentials.ts`)

```typescript
export const credentialsAtom = atom<R2Credentials | null>(null)
export const isCredentialsValidAtom = atom<boolean>(false)
```

#### settingsAtom (`src/renderer/src/state/settings.ts`)

```typescript
export const themeAtom = atomWithStorage<Theme>("theme", "system")
export const autoTrackingAtom = atomWithStorage<boolean>("autoTracking", true)
```

### 2. 派生Atom

#### filteredGamesAtom

```typescript
export const filteredGamesAtom = atom((get) => {
  const games = get(gamesAtom)
  const searchQuery = get(searchQueryAtom)
  const statusFilter = get(playStatusFilterAtom)
  const sortBy = get(sortByAtom)

  let filtered = games

  // フィルタリング
  if (searchQuery) {
    filtered = filtered.filter(
      (game) =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.publisher.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  if (statusFilter !== "ALL") {
    filtered = filtered.filter((game) => game.playStatus === statusFilter)
  }

  // ソート
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "lastPlayed":
        if (!a.lastPlayed && !b.lastPlayed) return 0
        if (!a.lastPlayed) return 1
        if (!b.lastPlayed) return -1
        return b.lastPlayed.getTime() - a.lastPlayed.getTime()
      default:
        return 0
    }
  })

  return filtered
})
```

## スタイリング

### 1. Tailwind CSS設定

#### テーマ設定

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb"
          // ...
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [require("daisyui"), require("tailwind-scrollbar")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3b82f6",
          secondary: "#64748b"
          // ...
        },
        dark: {
          primary: "#60a5fa",
          secondary: "#94a3b8"
          // ...
        }
      }
    ]
  }
}
```

### 2. 共通スタイルクラス

#### レイアウト

```css
.container-app {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.grid-games {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}
```

#### カード

```css
.card-game {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200;
}

.card-game-image {
  @apply w-full h-48 object-cover rounded-t-lg;
}
```

#### ボタン

```css
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200;
}

.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium px-4 py-2 rounded-lg transition-colors duration-200;
}
```

### 3. レスポンシブデザイン

#### ブレークポイント

- `sm`: 640px以上
- `md`: 768px以上
- `lg`: 1024px以上
- `xl`: 1280px以上

#### レスポンシブ対応例

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
  {games.map((game) => (
    <GameCard key={game.id} game={game} />
  ))}
</div>
```

## テスト

### 1. コンポーネントテスト

#### テスト構成

```typescript
// GameModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GameModal } from '../GameModal'

describe('GameModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onGameSaved: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default values', () => {
    render(<GameModal {...mockProps} />)

    expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
    expect(screen.getByLabelText('出版社')).toBeInTheDocument()
    expect(screen.getByLabelText('実行ファイルパス')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<GameModal {...mockProps} />)

    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument()
    })
  })
})
```

### 2. フックテスト

#### useGameActionsのテスト

```typescript
// useGameActions.test.tsx
import { renderHook, act } from "@testing-library/react"
import { useGameActions } from "../useGameActions"

// Mock window.api
const mockApi = {
  game: {
    createGame: jest.fn(),
    updateGame: jest.fn(),
    deleteGame: jest.fn()
  }
}

Object.defineProperty(window, "api", {
  value: mockApi
})

describe("useGameActions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create game successfully", async () => {
    const mockGame = { id: "1", title: "Test Game" }
    mockApi.game.createGame.mockResolvedValue({
      success: true,
      data: mockGame
    })

    const { result } = renderHook(() => useGameActions())

    let createResult
    await act(async () => {
      createResult = await result.current.createGame({
        title: "Test Game",
        publisher: "Test Publisher",
        exePath: "/path/to/game.exe",
        playStatus: "UNPLAYED"
      })
    })

    expect(createResult.success).toBe(true)
    expect(createResult.data).toEqual(mockGame)
  })
})
```

### 3. E2Eテスト

#### メインワークフローのテスト

```typescript
// gameManagement.e2e.test.ts
import { test, expect } from "@playwright/test"

test.describe("Game Management", () => {
  test("should add new game", async ({ page }) => {
    await page.goto("/")

    // ゲーム追加ボタンをクリック
    await page.click('[data-testid="add-game-button"]')

    // フォームに入力
    await page.fill('[data-testid="game-title"]', "Test Game")
    await page.fill('[data-testid="game-publisher"]', "Test Publisher")
    await page.fill('[data-testid="game-exe-path"]', "/path/to/game.exe")

    // 保存
    await page.click('[data-testid="save-button"]')

    // 成功メッセージを確認
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // ゲームリストに追加されたことを確認
    await expect(page.locator('[data-testid="game-card"]')).toContainText("Test Game")
  })
})
```

## パフォーマンス最適化

### 1. メモ化

#### React.memo

```tsx
export const GameCard = React.memo<GameCardProps>(({ game, onClick, onEdit, onDelete }) => {
  return (
    <div className="card-game" onClick={() => onClick?.(game)}>
      {/* カード内容 */}
    </div>
  )
})
```

#### useMemo

```tsx
const GameList: React.FC = () => {
  const [games] = useAtom(gamesAtom)
  const [searchQuery] = useAtom(searchQueryAtom)

  const filteredGames = useMemo(() => {
    return games.filter((game) => game.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [games, searchQuery])

  return (
    <div>
      {filteredGames.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
```

#### useCallback

```tsx
const GameModal: React.FC<GameModalProps> = ({ onGameSaved }) => {
  const handleSubmit = useCallback(
    async (data: GameFormData) => {
      const result = await window.api.game.createGame(data)
      if (result.success) {
        onGameSaved?.(result.data)
      }
    },
    [onGameSaved]
  )

  return <form onSubmit={handleSubmit}>{/* フォーム内容 */}</form>
}
```

### 2. 仮想化

#### 大量リストの最適化

```tsx
import { VariableSizeList as List } from "react-window"

const VirtualizedGameList: React.FC = () => {
  const [games] = useAtom(gamesAtom)

  const getItemSize = (index: number) => {
    // アイテムのサイズを動的に計算
    return 200 // ベース高さ
  }

  const renderItem = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <GameCard game={games[index]} />
    </div>
  )

  return (
    <List height={600} itemCount={games.length} itemSize={getItemSize} width="100%">
      {renderItem}
    </List>
  )
}
```

## アクセシビリティ

### 1. キーボードナビゲーション

#### フォーカス管理

```tsx
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" onKeyDown={handleKeyDown} tabIndex={-1}>
      {children}
    </div>
  )
}
```

### 2. ARIAラベル

#### スクリーンリーダー対応

```tsx
const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <article
      className="card-game"
      role="button"
      tabIndex={0}
      aria-label={`${game.title} by ${game.publisher}`}
    >
      <img src={game.imagePath} alt={`${game.title}のゲーム画像`} className="card-game-image" />
      <div className="p-4">
        <h3 className="font-semibold">{game.title}</h3>
        <p className="text-gray-600">{game.publisher}</p>
        <div aria-label={`プレイステータス: ${getStatusLabel(game.playStatus)}`}>
          <PlayStatusBadge status={game.playStatus} />
        </div>
      </div>
    </article>
  )
}
```

## エラーバウンダリ

### ErrorBoundary実装

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## まとめ

このコンポーネント仕様書は、CloudLaunchのフロントエンドコンポーネントの設計思想と実装ガイドラインを定義しています。新しいコンポーネントを作成する際や既存コンポーネントを変更する際は、この仕様に従って実装してください。

重要なポイント：

- 型安全性の確保
- 再利用可能性の重視
- パフォーマンス最適化
- アクセシビリティ対応
- テスタビリティの確保
