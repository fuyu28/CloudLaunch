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
<MainLayout>
  <GameHeader game={game} />
  <TabNavigation>
    <TabPanel name="overview">
      <GameOverview />
      <PlayStatusBar />
    </TabPanel>
    <TabPanel name="sessions">
      <PlaySessionCard />
      <PlaySessionManagementModal />
    </TabPanel>
    <TabPanel name="chapters">
      <ChapterDisplayCard />
      <ChapterBarChart />
    </TabPanel>
    <TabPanel name="saves">
      <SaveDataManager />
    </TabPanel>
  </TabNavigation>
</MainLayout>
```

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
