-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "qualityLabel" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("hash", "id", "path", "quality", "qualityLabel", "videoId") SELECT "hash", "id", "path", "quality", "qualityLabel", "videoId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");
CREATE UNIQUE INDEX "File_hash_key" ON "File"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
