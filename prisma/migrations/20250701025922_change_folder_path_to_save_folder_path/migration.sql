/*
  Warnings:

  - You are about to drop the column `folderPath` on the `Game` table. All the data in the column will be lost.
  - Added the required column `saveFolderPath` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "saveFolderPath" TEXT NOT NULL,
    "exePath" TEXT NOT NULL,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playStatus" TEXT NOT NULL DEFAULT 'unplayed',
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "lastPlayed" DATETIME
);
INSERT INTO "new_Game" ("createdAt", "exePath", "id", "imagePath", "lastPlayed", "playStatus", "publisher", "title", "totalPlayTime") SELECT "createdAt", "exePath", "id", "imagePath", "lastPlayed", "playStatus", "publisher", "title", "totalPlayTime" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
