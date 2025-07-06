import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  main: {
    plugins: [
      // 依存関係の外部化
      externalizeDepsPlugin({
        exclude: ["electron-store", "ps-list"]
      }),
      // ps-list のバイナリをコピー
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/ps-list/vendor/**",
            dest: "vendor" // 出力先 dist/vendor にコピーされる
          }
        ]
      })
    ]
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["electron-store", "ps-list"]
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/ps-list/vendor/**",
            dest: "vendor"
          }
        ]
      })
    ]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ["electron-store"]
    }
  }
})
