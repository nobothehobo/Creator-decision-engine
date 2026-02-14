# Creator Dashboard – YouTube Companion (No OAuth)

This app supports attaching a public YouTube video URL to an idea, fetching public stats via YouTube Data API v3, storing timestamped snapshots, and generating rule-based coaching feedback.

## Environment setup

Set these variables locally:

```bash
export DATABASE_URL="file:./dev.db"
export YOUTUBE_API_KEY="your_youtube_data_api_key"
```

### GitHub environment variables / secrets

In GitHub:
1. Go to **Settings → Secrets and variables → Actions**.
2. Add repository secret **`YOUTUBE_API_KEY`**.
3. Add variable/secret for **`DATABASE_URL`** appropriate to your deploy target.
4. Ensure your deployment workflow exposes these variables to the server runtime.

## Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

## API route

`POST /api/youtube/public`

Body:

```json
{
  "ideaId": 42,
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "mode": "snapshot"
}
```

- `mode: "attach"` attaches/syncs video metadata only.
- `mode: "snapshot"` (default) also persists a new `VideoSnapshot` row.

Response contains:

```json
{
  "videoId": "...",
  "title": "...",
  "publishedAt": "...",
  "channelTitle": "...",
  "viewCount": 0,
  "likeCount": 0,
  "commentCount": 0,
  "snapshots": [],
  "channelBaseline": {
    "avgViewsPerHour": 0,
    "avgEngagementPer1k": 0,
    "sampleSize": 0
  }
}
```

## Parser tests

```bash
node --test tests/youtube-video-id.test.js
```
