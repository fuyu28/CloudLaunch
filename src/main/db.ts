import fs from "fs"
import path from "path"

import { is } from "@electron-toolkit/utils"
import { PrismaClient } from "@prisma/client"
import { app } from "electron"

import { logger } from "./utils/logger"

const userDataDir = app.getPath("userData")
const devDbPath = path.join(process.cwd(), "dev.db")
const prodDbPath = path.join(userDataDir, "app.db")

// １) ユーザーフォルダを作成
if (!is.dev) {
  fs.mkdirSync(userDataDir, { recursive: true })
}

// ２) 初回起動時にバンドル版をコピー
if (!fs.existsSync(is.dev ? devDbPath : prodDbPath)) {
  if (is.dev) {
    fs.writeFileSync(devDbPath, "", { flag: "wx" })
  } else {
    // プロダクションでは resources/app.db をコピー
    const bundledDb = path.join(process.resourcesPath, "app.db")
    // → resources/app.asar ではなく、resources/ の直下
    if (!fs.existsSync(bundledDb)) {
      logger.error("Bundled app.db not found", { bundledDb })
      process.exit(1)
    }
    fs.copyFileSync(bundledDb, prodDbPath)
  }
}

// ３) PrismaClient を起動
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${is.dev ? devDbPath : prodDbPath}`
    }
  }
})
