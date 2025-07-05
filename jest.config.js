/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: __dirname,
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/?(*.)+(spec|test).ts",
    "**/?(*.)+(spec|test).tsx"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        }
      }
    ]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@main/(.*)$": "<rootDir>/src/main/$1",
    "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
    "^@preload/(.*)$": "<rootDir>/src/preload/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^src/(.*)$": "<rootDir>/src/$1"
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/test/**",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/out/"],
  clearMocks: true,
  restoreMocks: true
}
