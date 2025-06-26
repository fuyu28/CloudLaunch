import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [
      // 依存関係を外部化する中で electron-store だけ除外
      externalizeDepsPlugin({
        exclude: ['electron-store']
      })
    ]
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-store']
      })
    ]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      // dev モードのバンドルに electron-store を含める
      include: ['electron-store']
    }
  }
})
