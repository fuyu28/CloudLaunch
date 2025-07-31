import fs from "fs"
import path from "path"

import { is } from "@electron-toolkit/utils"
import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"
import { app } from "electron"

import { checkDatabaseIntegrity } from "./utils/databaseMigration"
import { logger } from "./utils/logger"

const userDataDir = app.getPath("userData")
const devDbPath = path.join(process.cwd(), "dev.db")
const prodDbPath = path.join(userDataDir, "app.db")

// １) ユーザーフォルダを作成
if (!is.dev) {
  fs.mkdirSync(userDataDir, { recursive: true })
}

// ２) 初回起動時または古いデータベースファイルの処理
const shouldResetDatabase = (): boolean => {
  if (is.dev) return !fs.existsSync(devDbPath)

  const dbExists = fs.existsSync(prodDbPath)
  if (!dbExists) return true

  // 本番環境で既存のデータベースファイルがある場合、スキーマバージョンをチェック
  try {
    const db = new Database(prodDbPath, { readonly: true })

    try {
      // _prisma_migrationsテーブルの存在チェック
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'")
        .get()

      if (!tableExists) {
        logger.info("古いデータベース形式を検出しました。データベースをリセットします")
        db.close()
        return true
      }

      // 最新のマイグレーションが適用されているかチェック
      const migrations = db
        .prepare(
          "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name DESC LIMIT 1"
        )
        .all()

      db.close()

      // マイグレーションが存在しない場合はリセット
      if (migrations.length === 0) {
        logger.info("マイグレーション履歴が見つかりません。データベースをリセットします")
        return true
      }

      return false
    } finally {
      db.close()
    }
  } catch (error) {
    logger.warn("データベースファイルの検証に失敗しました。データベースをリセットします", {
      error: error instanceof Error ? error.message : String(error)
    })
    return true
  }
}

if (shouldResetDatabase()) {
  if (is.dev) {
    fs.writeFileSync(devDbPath, "", { flag: "wx" })
  } else {
    // 既存の古いデータベースファイルを削除
    if (fs.existsSync(prodDbPath)) {
      try {
        fs.unlinkSync(prodDbPath)
        logger.info("古いデータベースファイルを削除しました", { path: prodDbPath })
      } catch (error) {
        logger.error("古いデータベースファイルの削除に失敗しました", {
          error: error instanceof Error ? error.message : String(error),
          path: prodDbPath
        })
      }
    }

    // プロダクションでは resources/app.db をコピー
    const bundledDb = path.join(process.resourcesPath, "app.db")

    logger.info("データベース初期化処理", {
      bundledDbPath: bundledDb,
      prodDbPath,
      resourcesPath: process.resourcesPath,
      bundledDbExists: fs.existsSync(bundledDb)
    })

    if (!fs.existsSync(bundledDb)) {
      logger.error("バンドルされたapp.dbが見つかりません", {
        bundledDb,
        resourcesPath: process.resourcesPath,
        resourcesContents: fs.existsSync(process.resourcesPath)
          ? fs.readdirSync(process.resourcesPath)
          : "resources directory not found"
      })
      process.exit(1)
    }

    try {
      fs.copyFileSync(bundledDb, prodDbPath)
      logger.info("データベースファイルを正常にコピーしました", {
        from: bundledDb,
        to: prodDbPath
      })

      // プロダクション環境でのファイル権限設定
      try {
        // 読み書き権限を確保（Windowsでは0o666、Unix系では適切な権限）
        fs.chmodSync(prodDbPath, 0o666)
        logger.info("データベースファイルの権限を設定しました", {
          path: prodDbPath,
          permissions: "0o666"
        })
      } catch (chmodError) {
        logger.warn("データベースファイルの権限設定に失敗しました", {
          error: chmodError instanceof Error ? chmodError.message : String(chmodError),
          path: prodDbPath
        })
      }
    } catch (error) {
      logger.error("データベースファイルのコピーに失敗しました", {
        error: error instanceof Error ? error.message : String(error),
        from: bundledDb,
        to: prodDbPath
      })
      process.exit(1)
    }
  }
} else {
  // 既存のデータベースファイルがある場合も権限をチェック
  if (!is.dev) {
    try {
      // ファイルの読み書き権限をテスト
      fs.accessSync(prodDbPath, fs.constants.R_OK | fs.constants.W_OK)
      logger.info("既存データベースファイルの権限確認済み", { path: prodDbPath })
    } catch (accessError) {
      logger.warn("データベースファイルへのアクセス権限に問題があります", {
        error: accessError instanceof Error ? accessError.message : String(accessError),
        path: prodDbPath
      })

      // 権限修正を試行
      try {
        fs.chmodSync(prodDbPath, 0o666)
        logger.info("データベースファイルの権限を修正しました", {
          path: prodDbPath,
          permissions: "0o666"
        })
      } catch (chmodError) {
        logger.error("データベースファイルの権限修正に失敗しました", {
          error: chmodError instanceof Error ? chmodError.message : String(chmodError),
          path: prodDbPath
        })
      }
    }
  }
}

// ３) PrismaClient を起動
const dbUrl = `file:${is.dev ? devDbPath : prodDbPath}`
// logger.info("PrismaClient初期化", {
//   isDev: is.dev,
//   dbUrl,
//   dbPath: is.dev ? devDbPath : prodDbPath,
//   dbExists: fs.existsSync(is.dev ? devDbPath : prodDbPath)
// })

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  },
  // プロダクション環境でのトランザクション設定を最適化
  transactionOptions: {
    timeout: is.dev ? 30000 : 10000, // 開発環境30秒、本番環境10秒
    maxWait: is.dev ? 5000 : 2000, // 開発環境5秒、本番環境2秒待機
    isolationLevel: "Serializable" // Prismaでサポートされている分離レベル
  },
  log: is.dev ? ["warn", "error"] : ["warn", "error"]
})

// データベース接続のテスト
prisma
  .$connect()
  .then(async () => {
    // データベース整合性チェック
    const isIntegrityOk = await checkDatabaseIntegrity(prisma)

    if (!isIntegrityOk) {
      logger.warn(
        "データベース整合性チェックに失敗しました。データベースの初期化が必要な可能性があります"
      )
    }
  })
  .catch((error) => {
    logger.error("データベース接続に失敗しました", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      dbUrl,
      dbPath: is.dev ? devDbPath : prodDbPath
    })
  })
