/*
  Warnings:

  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PlaySession` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "Upload_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "imagePath" TEXT,
    "exePath" TEXT NOT NULL,
    "saveFolderPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playStatus" TEXT NOT NULL DEFAULT 'unplayed',
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "lastPlayed" DATETIME
);
INSERT INTO "new_Game" ("createdAt", "exePath", "id", "imagePath", "lastPlayed", "playStatus", "publisher", "saveFolderPath", "title", "totalPlayTime") SELECT "createdAt", "exePath", "id", "imagePath", "lastPlayed", "playStatus", "publisher", "saveFolderPath", "title", "totalPlayTime" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE TABLE "new_PlaySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "uploadId" TEXT,
    CONSTRAINT "PlaySession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaySession_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlaySession" ("duration", "gameId", "id", "playedAt") SELECT "duration", "gameId", "id", "playedAt" FROM "PlaySession";
DROP TABLE "PlaySession";
ALTER TABLE "new_PlaySession" RENAME TO "PlaySession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
