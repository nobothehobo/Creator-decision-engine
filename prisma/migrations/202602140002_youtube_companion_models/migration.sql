-- Replace old snapshot table with normalized video + snapshots model
DROP TABLE IF EXISTS "VideoStatsSnapshot";

CREATE TABLE "Video" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "ideaId" INTEGER NOT NULL,
  "videoId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publishedAt" DATETIME NOT NULL,
  "channelTitle" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Video_ideaId_fkey"
    FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Video_videoId_key" ON "Video" ("videoId");
CREATE INDEX "Video_ideaId_createdAt_idx" ON "Video" ("ideaId", "createdAt");
CREATE INDEX "Video_channelTitle_idx" ON "Video" ("channelTitle");

CREATE TABLE "VideoSnapshot" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "videoRefId" INTEGER NOT NULL,
  "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "viewCount" INTEGER NOT NULL,
  "likeCount" INTEGER,
  "commentCount" INTEGER,
  CONSTRAINT "VideoSnapshot_videoRefId_fkey"
    FOREIGN KEY ("videoRefId") REFERENCES "Video" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VideoSnapshot_videoRefId_fetchedAt_idx" ON "VideoSnapshot" ("videoRefId", "fetchedAt");
