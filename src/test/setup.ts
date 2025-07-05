import "@testing-library/jest-dom"

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
