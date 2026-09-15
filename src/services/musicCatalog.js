export const PAGE_SIZE = 20;
const API = 'https://api.audius.co/v1';
const APP = 'DevsonPortfolio';
export function streamUrl(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9]+$/.test(id)) throw new Error('Invalid track. Please choose another song.');
  return `${API}/tracks/${id}/stream?app_name=${APP}`;
}
export function normalizePublicTrack(track) {
  if (!track || typeof track.id !== 'string' || !/^[a-zA-Z0-9]+$/.test(track.id) || !track.title ||
      track.is_available === false || track.is_delete || track.is_unlisted ||
      track.is_stream_gated || track.stream_conditions || track.access?.stream === false) return null;
  const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'];
  return {
    id: track.id, title: track.title, artist: track.user?.name || 'Unknown artist',
    source: 'audius', artwork: artwork?.startsWith('https://') ? artwork : '',
    duration: Number(track.duration) || 0, url: streamUrl(track.id),
  };
}
export async function searchTracks(query, { offset = 0, signal } = {}) {
  const term = query.trim().slice(0, 150);
  if (!term) return { tracks: [], hasMore: false };
  const params = new URLSearchParams({ query: term, offset: String(offset), limit: String(PAGE_SIZE), app_name: APP });
  const response = await fetch(`${API}/tracks/search?${params}`, { signal });
  if (!response.ok) throw new Error(response.status === 429 ? 'Music search is busy. Please try again shortly.' : 'Music search is unavailable. Please try again.');
  const body = await response.json();
  if (!Array.isArray(body.data)) throw new Error('Unexpected search response. Please try again.');
  return { tracks: body.data.map(normalizePublicTrack).filter(Boolean), hasMore: body.data.length === PAGE_SIZE };
}
