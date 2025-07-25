import "@testing-library/jest-dom"
import type { API } from "../preload/preload.d"

// Type declarations for test environment
declare global {
  interface Window {
    api: API
  }
}

// Mock Electron APIs
Object.assign(global.window, {
  electron: {
    ipcRenderer: {
      invoke: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      send: jest.fn(),
      once: jest.fn(),
      removeAllListeners: jest.fn()
    }
  },
  api: {
    file: {
      selectFile: jest.fn(),
      selectFolder: jest.fn(),
      validatePath: jest.fn()
    },
    window: {
      minimize: jest.fn(),
      toggleMaximize: jest.fn(),
      close: jest.fn()
    },
    saveData: {
      upload: {
        uploadSaveDataFolder: jest.fn()
      },
      download: {
        downloadSaveData: jest.fn(),
        getCloudDataInfo: jest.fn(),
        getCloudFileDetails: jest.fn()
      },
      listFolders: {
        listRemoteSaveDataFolders: jest.fn()
      }
    },
    cloudData: {
      listCloudData: jest.fn(),
      deleteCloudData: jest.fn(),
      getCloudFileDetails: jest.fn(),
      getDirectoryTree: jest.fn(),
      deleteFile: jest.fn()
    },
    credential: {
      upsertCredential: jest.fn(),
      getCredential: jest.fn(),
      validateCredential: jest.fn()
    },
    database: {
      listGames: jest.fn(),
      getGameById: jest.fn(),
      createGame: jest.fn(),
      updateGame: jest.fn(),
      deleteGame: jest.fn(),
      createSession: jest.fn(),
      getPlaySessions: jest.fn(),
      updateSessionChapter: jest.fn(),
      updateSessionName: jest.fn(),
      deletePlaySession: jest.fn()
    },
    loadImage: {
      loadImageFromLocal: jest.fn(),
      loadImageFromWeb: jest.fn()
    },
    game: {
      launchGame: jest.fn(),
      launchGameFromSteam: jest.fn()
    },
    processMonitor: {
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      addGameToMonitor: jest.fn(),
      removeGameFromMonitor: jest.fn(),
      getMonitoringStatus: jest.fn(),
      isMonitoring: jest.fn(),
      getGameProcesses: jest.fn(),
      deleteProcess: jest.fn(),
      setLinkedProcess: jest.fn()
    },
    chapter: {
      getChapters: jest.fn(),
      createChapter: jest.fn(),
      updateChapter: jest.fn(),
      deleteChapter: jest.fn(),
      updateChapterOrders: jest.fn(),
      getChapterStats: jest.fn(),
      ensureDefaultChapter: jest.fn(),
      setCurrentChapter: jest.fn()
    },
    settings: {
      updateAutoTracking: jest.fn(),
      getAutoTracking: jest.fn()
    }
  }
})

// Mock electron-store
jest.mock("electron-store", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
    size: 0,
    store: {},
    openInEditor: jest.fn(),
    path: "/mock/path",
    events: {}
  }))
})

// Mock keytar
jest.mock("keytar", () => ({
  getPassword: jest.fn(),
  setPassword: jest.fn(),
  deletePassword: jest.fn(),
  getCredentials: jest.fn(),
  findCredentials: jest.fn()
}))

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    game: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    playSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    upload: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}))

// Mock AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn()
}))

// Mock file-type (conditional mock)
jest.mock(
  "file-type",
  () => ({
    fileTypeFromFile: jest.fn()
  }),
  { virtual: true }
)

// Mock React Router
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" }),
  useParams: () => ({})
}))

// Mock React Hot Toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  toast: jest.fn()
}))

// Mock import.meta for Vite compatibility
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        DEV: process.env.NODE_ENV === "development"
      }
    }
  }
})

// Console setup for cleaner test output
const originalError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Warning: ReactDOM.render is no longer supported")
  ) {
    return
  }
  originalError.call(console, ...args)
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
