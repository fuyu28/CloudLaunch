/*
  Warnings:

  - You are about to drop the column `processName` on the `PlaySession` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "sessionName" TEXT,
    "chapterId" TEXT,
    "uploadId" TEXT,
    CONSTRAINT "PlaySession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaySession_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlaySession_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlaySession" ("chapterId", "duration", "gameId", "id", "playedAt", "uploadId") SELECT "chapterId", "duration", "gameId", "id", "playedAt", "uploadId" FROM "PlaySession";
DROP TABLE "PlaySession";
ALTER TABLE "new_PlaySession" RENAME TO "PlaySession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
