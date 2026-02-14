-- Add youtubeUrl on Idea and create VideoStatsSnapshot
ALTER TABLE "Idea" ADD COLUMN "youtubeUrl" TEXT;

CREATE TABLE "VideoStatsSnapshot" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "ideaId" INTEGER NOT NULL,
  "videoId" TEXT NOT NULL,
  "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "viewCount" INTEGER NOT NULL,
  "likeCount" INTEGER,
  "commentCount" INTEGER,
  CONSTRAINT "VideoStatsSnapshot_ideaId_fkey"
    FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VideoStatsSnapshot_ideaId_fetchedAt_idx"
  ON "VideoStatsSnapshot" ("ideaId", "fetchedAt");
CREATE INDEX "VideoStatsSnapshot_videoId_idx"
  ON "VideoStatsSnapshot" ("videoId");
