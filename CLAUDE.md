# CLAUDE.md

必ず日本語で出力してください
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
- **ipcHandlers/** - Individual handlers for different features (games, credentials, file operations)

#### Renderer Process (React)

- **App.tsx** - Main routing configuration
- **state/home.ts** - Global state atoms for game filtering and search
- **pages/** - Main application pages (Home, GameDetail, Settings)
- **components/** - Reusable UI components with consistent styling

#### Database Schema

- **Game** model with play tracking (play status, sessions, total time)
- **PlaySession** model for detailed gameplay statistics
- SQLite database with automatic migrations

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
