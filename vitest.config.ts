import { resolve } from "path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "out"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/test/**", "node_modules/**"]
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@main": resolve(__dirname, "src/main"),
      "@renderer": resolve(__dirname, "src/renderer"),
      "@preload": resolve(__dirname, "src/preload"),
      "@shared": resolve(__dirname, "src/shared")
    }
  }
})
