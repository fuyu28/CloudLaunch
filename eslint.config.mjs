import tseslint from "@electron-toolkit/eslint-config-ts"
import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier"
import eslintPluginReact from "eslint-plugin-react"
import eslintPluginReactHooks from "eslint-plugin-react-hooks"
import eslintPluginReactRefresh from "eslint-plugin-react-refresh"
import eslintPluginImport from "eslint-plugin-import"

export default tseslint.config(
  { ignores: ["**/node_modules", "**/dist", "**/out"] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh,
      import: eslintPluginImport
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      "import/order": [
        "warn",
        {
          groups: [
            "builtin", // Node.jsビルトインモジュール
            "external", // 外部ライブラリ（reactなど）
            "internal", // 自作モジュール（@やエイリアスなど）
            ["parent", "sibling", "index", "type"] // 相対パス
          ],
          pathGroups: [
            {
              pattern: "./ipcHandlers/**",
              group: "internal",
              position: "after"
            }
          ],
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          },
          "newlines-between": "always"
        }
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }]
    }
  },
  eslintConfigPrettier
)
