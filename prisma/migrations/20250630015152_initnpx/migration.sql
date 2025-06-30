-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL,
    "exePath" TEXT NOT NULL,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "lastPlayed" DATETIME
);
INSERT INTO "new_Game" ("createdAt", "exePath", "folderPath", "id", "imagePath", "publisher", "title") SELECT "createdAt", "exePath", "folderPath", "id", "imagePath", "publisher", "title" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
