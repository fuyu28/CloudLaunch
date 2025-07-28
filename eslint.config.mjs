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
          // グループ順は外部→内部→相対／型
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index", "type"]],
          // internal グループの中で「components → hooks」の順序を明示
          pathGroups: [
            {
              pattern: "@renderer/components/**",
              group: "internal",
              position: "before" // internal グループ先頭に
            },
            {
              pattern: "@renderer/hooks/**",
              group: "internal",
              position: "after" // internal グループ末尾に
            }
          ],
          // 型 import ("import type") は parent/type のグループ扱い
          pathGroupsExcludedImportTypes: ["type"],
          // 同グループ内は昇順アルファベットソート
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          },
          // グループ間には必ず空行を
          "newlines-between": "always"
        }
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }]
    }
  },
  eslintConfigPrettier
)
