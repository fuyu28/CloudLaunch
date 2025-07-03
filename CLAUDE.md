# CLAUDE.md

必ず日本語で出力してください。

コードを作成した後は`npx run format`を行ってください。

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build application (runs typecheck first)
- `npm run typecheck` - Run TypeScript checks for both node and web
- `npm run lint` - Run ESLint with cache
- `npm run format` - Format code with Prettier

### Platform-specific Builds

- `npm run build:win` - Build for Windows
- `npm run build:mac` - Build for macOS
- `npm run build:linux` - Build for Linux
- `npm run build:unpack` - Build without packaging

### Database Operations

- `npx prisma migrate dev` - Apply database migrations in development
- `npx prisma generate` - Generate Prisma client
- `npx prisma db seed` - Seed database with test data

## Architecture Overview

GameSync is an Electron-based game launcher and save data synchronization application with the following architecture:

### Technology Stack

- **Frontend**: React 19 with TypeScript, React Router, Tailwind CSS + DaisyUI
- **Backend**: Electron main process with IPC communication
- **Database**: SQLite with Prisma ORM
- **State Management**: Jotai for React state
- **Cloud Storage**: AWS S3 (via R2Client) for save data backup
- **Build System**: electron-vite

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── ipcHandlers/   # IPC communication handlers
│   ├── service/       # Business logic services
│   └── utils/         # Utility functions
├── preload/        # Electron preload scripts (security bridge)
│   └── api/           # API definitions for renderer
├── renderer/       # React frontend application
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-based page components
│   ├── state/         # Jotai state atoms
│   └── utils/         # Frontend utilities
└── types/          # Shared TypeScript definitions
```

### Key Components

#### Main Process (Node.js)

- **registerHandlers.ts** - Centralized IPC handler registration
- **db.ts** - Prisma database client setup
- **r2Client.ts** - AWS S3 client for save data storage
- **ipcHandlers/** - Individual handlers for different features:
  - `databaseHandlers.ts` - ゲーム管理とプレイセッション記録
  - `credentialHandlers.ts` - R2/S3認証情報管理
  - `uploadSaveDataFolderHandlers.ts` - クラウドアップロード
  - `downloadHandler.ts` - クラウドダウンロード
  - `launchGameHandlers.ts` - ゲーム起動とプロセス管理
  - `fileHandlers.ts` - ファイル選択ダイアログ
- **service/** - ビジネスロジックサービス:
  - `credentialService.ts` - セキュアな認証情報管理（keytar + electron-store）
- **utils/** - ユーティリティ関数:
  - `file.ts` - ファイル検証とパス解析
  - `awsSdkErrorHandler.ts` - AWS SDK エラー処理
  - `errorHandler.ts` - アプリケーション固有エラー

#### Renderer Process (React)

- **App.tsx** - Main routing configuration
- **state/home.ts** - Global state atoms for game filtering and search
- **pages/** - Main application pages:
  - `Home.tsx` - ゲーム一覧・検索・フィルタ
  - `GameDetail.tsx` - ゲーム詳細・プレイ記録
  - `Settings.tsx` - R2/S3認証設定
- **components/** - Reusable UI components:
  - `GameModal.tsx` - ゲーム登録・編集フォーム
  - `GameCard.tsx` - ゲーム表示カード
- **utils/** - フロントエンドユーティリティ
- **hooks/** - カスタムReact Hooks

#### Database Schema

- **Game** model - ゲーム基本情報とプレイ統計:
  - UUID主キー、タイトル、発行元、ファイルパス
  - プレイステータス（未プレイ・プレイ中・クリア済み）
  - 総プレイ時間、最終プレイ日時
- **PlaySession** model - 詳細プレイセッション記録:
  - セッション時間、プレイ日時
  - 将来的なクラウド同期情報（Upload関連）
- **Upload** model - クラウド同期履歴:
  - クライアントID（PC識別）、コメント、作成日時
  - PlaySessionとの関連付け

### IPC Communication Pattern

The app uses a structured IPC pattern:

1. **Preload APIs** expose safe interfaces to renderer
2. **Main handlers** process requests and interact with system resources
3. **Type-safe** communication using shared TypeScript definitions

### State Management

- **Jotai** for React state management
- **Atoms** for search, filtering, and game visibility
- **Electron-store** for persistent application settings

## Development Notes

### Security

- Context isolation enabled with secure preload bridge
- No direct Node.js access from renderer process
- Credential management through dedicated handlers

### Build Process

- TypeScript compilation for both main and renderer processes
- Automatic type checking before builds
- Platform-specific electron-builder configurations

### Testing

- Database seeding available via `prisma db seed`
- Test data generation using @faker-js/faker

## Development Guidelines

### Code Quality Standards

- **コメント**: 全ての重要ファイルに `@fileoverview` コメントを記述
- **エラーハンドリング**: エラー変数は `error` に統一（`err` ではない）
- **変数命名**: 一貫した命名規約を使用:
  - `gameData` (ゲーム情報)
  - `localPath`, `remotePath` (パス関連)
  - `result`, `credentialResult` (結果変数)
- **型安全**: `ApiResult<T>` 型で統一的なエラー処理
- **セキュリティ**: 認証情報はkeytar（OSキーチェーン）で保護

### Documentation

- **コーディングガイドライン**: `docs/CODING_GUIDELINES.md`
- **開発ワークフロー**: `docs/DEVELOPMENT_WORKFLOW.md`
- **機能配置ガイド**: どこに何を実装すべきかの詳細ガイド

### Development Commands Reference

- 必須コマンド: `npm run typecheck`, `npm run lint`, `npm run format`
- データベース操作: `npx prisma migrate dev`, `npx prisma generate`
