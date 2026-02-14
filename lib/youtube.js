const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function parseYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;

  let url;
  try {
    url = new URL(input.trim());
  } catch {
    return VIDEO_ID_PATTERN.test(input.trim()) ? input.trim() : null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    const candidate = url.pathname.split('/').filter(Boolean)[0] || '';
    return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
  }

  if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    const fromQuery = url.searchParams.get('v');
    if (VIDEO_ID_PATTERN.test(fromQuery || '')) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['shorts', 'embed'].includes(parts[0])) {
      const candidate = parts[1];
      return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
    }
  }

  return null;
}

async function fetchPublicVideoData(videoId, apiKey, fetchImpl = fetch) {
  if (!VIDEO_ID_PATTERN.test(videoId || '')) throw new Error('Invalid videoId.');
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY.');

  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet,statistics');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetchImpl(endpoint.toString());
  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || 'YouTube API request failed.';
    throw new Error(message);
  }

  const item = payload?.items?.[0];
  if (!item) throw new Error('Video not found or unavailable.');

  const snippet = item.snippet || {};
  const stats = item.statistics || {};

  return {
    videoId,
    title: snippet.title || 'Untitled',
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    channelTitle: snippet.channelTitle || 'Unknown channel',
    viewCount: Number(stats.viewCount || 0),
    likeCount: stats.likeCount == null ? null : Number(stats.likeCount),
    commentCount: stats.commentCount == null ? null : Number(stats.commentCount),
  };
}

module.exports = {
  parseYouTubeVideoId,
  fetchPublicVideoData,
};
