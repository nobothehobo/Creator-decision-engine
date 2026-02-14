const { PrismaClient } = require('@prisma/client');
const { parseYouTubeVideoId, fetchPublicVideoData } = require('../../lib/youtube');

const prisma = new PrismaClient();

function toIdeaId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { ideaId: rawIdeaId, youtubeUrl, mode = 'snapshot' } = req.body || {};
  const ideaId = toIdeaId(rawIdeaId);
  if (!ideaId) return res.status(400).json({ error: 'Invalid ideaId.' });

  const videoId = parseYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL. Try watch, youtu.be, shorts, or embed links.' });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'Missing YOUTUBE_API_KEY in environment.' });
  }

  try {
    const publicData = await fetchPublicVideoData(videoId, process.env.YOUTUBE_API_KEY);

    await prisma.idea.update({ where: { id: ideaId }, data: { youtubeUrl } });

    const video = await prisma.video.upsert({
      where: { videoId },
      update: {
        ideaId,
        title: publicData.title,
        publishedAt: new Date(publicData.publishedAt),
        channelTitle: publicData.channelTitle,
      },
      create: {
        ideaId,
        videoId,
        title: publicData.title,
        publishedAt: new Date(publicData.publishedAt),
        channelTitle: publicData.channelTitle,
      },
    });

    if (mode !== 'attach') {
      await prisma.videoSnapshot.create({
        data: {
          videoRefId: video.id,
          viewCount: publicData.viewCount,
          likeCount: publicData.likeCount,
          commentCount: publicData.commentCount,
        },
      });
    }

    const snapshots = await prisma.videoSnapshot.findMany({
      where: { videoRefId: video.id },
      orderBy: { fetchedAt: 'desc' },
      take: 30,
    });

    const channelVideos = await prisma.video.findMany({
      where: { channelTitle: video.channelTitle },
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1,
        },
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
    });

    const baselines = channelVideos
      .map((v) => {
        const latest = v.snapshots[0];
        if (!latest) return null;
        const ageHours = Math.max(1, (new Date(latest.fetchedAt) - new Date(v.publishedAt)) / 3600000);
        const viewsPerHour = latest.viewCount / ageHours;
        const engagementPer1k = latest.viewCount > 0
          ? ((latest.likeCount || 0) + (latest.commentCount || 0)) * 1000 / latest.viewCount
          : 0;
        return { viewsPerHour, engagementPer1k };
      })
      .filter(Boolean);

    const channelBaseline = baselines.length
      ? {
          avgViewsPerHour: baselines.reduce((s, b) => s + b.viewsPerHour, 0) / baselines.length,
          avgEngagementPer1k: baselines.reduce((s, b) => s + b.engagementPer1k, 0) / baselines.length,
          sampleSize: baselines.length,
        }
      : null;

    return res.status(200).json({
      ...publicData,
      snapshots,
      channelBaseline,
    });
  } catch (error) {
    const message = String(error?.message || 'Unable to fetch YouTube data.');
    if (/quota/i.test(message)) {
      return res.status(429).json({ error: 'YouTube quota exceeded. Please try later.' });
    }
    if (/not found|unavailable/i.test(message)) {
      return res.status(404).json({ error: 'Video not found or unavailable.' });
    }
    return res.status(502).json({ error: message });
  }
};
