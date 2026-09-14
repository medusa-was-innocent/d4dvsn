export const PAGE_SIZE = 20;

export function parseAudiomackLink(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['audiomack.com', 'www.audiomack.com'].includes(url.hostname) || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed') parts.shift();
    if (parts.length !== 3) return null;
    const types = ['song', 'album', 'playlist'];
    const [artist, type, slug] = types.includes(parts[0]) ? [parts[1], parts[0], parts[2]] : parts;
    if (!types.includes(type) || !artist || !slug) return null;
    const path = [artist, type, slug].join('/');
    return { id: path, title: decodeURIComponent(slug).replaceAll('-', ' '), artist, type, url: `https://audiomack.com/${path}`, embedUrl: `https://audiomack.com/embed/${path}` };
  } catch { return null; }
}

export async function searchTracks(query, { offset = 0, signal } = {}) {
  const params = new URLSearchParams({ q: query, page: String(Math.floor(offset / PAGE_SIZE) + 1) });
  const response = await fetch(`/api/music/search?${params}`, { signal });
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Audiomack search needs the portfolio’s server. Static hosting alone cannot run catalog search.');
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Audiomack search is unavailable.');
  if (!Array.isArray(body.tracks)) throw new Error('Unexpected search response. Please try again.');
  return { tracks: body.tracks.filter(track => parseAudiomackLink(track.url)), hasMore: Boolean(body.hasMore) };
}
