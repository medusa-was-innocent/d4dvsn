import { createHmac, randomBytes } from 'node:crypto';

const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

export function authorization(url, key, secret, { nonce = randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const oauth = { oauth_consumer_key: key, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: String(timestamp), oauth_version: '1.0' };
  const params = [...url.searchParams.entries(), ...Object.entries(oauth)].map(([k, v]) => [encode(k), encode(v)]).sort(([a, b], [c, d]) => a < c ? -1 : a > c ? 1 : b < d ? -1 : b > d ? 1 : 0);
  const base = ['GET', `${url.origin}${url.pathname}`, params.map(([k, v]) => `${k}=${v}`).join('&')].map(encode).join('&');
  oauth.oauth_signature = createHmac('sha1', `${encode(secret)}&`).update(base).digest('base64');
  return `OAuth ${Object.entries(oauth).map(([k, v]) => `${encode(k)}="${encode(v)}"`).join(', ')}`;
}

export function normalizeTrack(track) {
  if (!track.id || !track.title || track.type !== 'song' || !track.uploader?.url_slug || !track.url_slug || track.live === false) return null;
  const path = `${encodeURIComponent(track.uploader.url_slug)}/song/${encodeURIComponent(track.url_slug)}`;
  return { id: String(track.id), title: track.title, artist: typeof track.artist === 'string' ? track.artist : track.uploader.name, artwork: /^https:\/\//.test(track.image || '') ? track.image : '', type: 'song', url: `https://audiomack.com/${path}`, embedUrl: `https://audiomack.com/embed/${path}` };
}

export function createAudiomackMiddleware(env, fetchImpl = fetch) {
  const key = env.AUDIOMACK_CONSUMER_KEY;
  const secret = env.AUDIOMACK_CONSUMER_SECRET;
  const configured = Boolean(key && secret);
  const cache = new Map();
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (!['/api/music/status', '/api/music/search'].includes(url.pathname)) return next();
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'GET') return send(405, { message: 'Only GET is supported.' });
    if (url.pathname.endsWith('/status')) return send(200, { configured });
    if (!configured) return send(503, { message: 'Audiomack catalog search is not connected yet. The portfolio owner must configure an approved application key and secret on the server.' });
    const query = (url.searchParams.get('q') || '').trim();
    const page = Number(url.searchParams.get('page') || 1);
    if (!query || query.length > 150 || !Number.isInteger(page) || page < 1 || page > 100) return send(400, { message: 'Enter a song or artist name (up to 150 characters).' });
    const cacheKey = `${query}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return send(200, cached.body);
    const upstream = new URL('https://api.audiomack.com/v1/search');
    upstream.search = new URLSearchParams({ q: query, show: 'songs', sort: 'relevance', verified: '1', limit: '20', page: String(page) });
    try {
      const response = await fetchImpl(upstream, { headers: { Authorization: authorization(upstream, key, secret) }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) return send(response.status === 429 ? 429 : 502, { message: response.status === 401 ? 'Audiomack rejected the application credentials. Check the server configuration.' : 'Audiomack search is temporarily unavailable. Try again shortly.' });
      const data = await response.json();
      if (!Array.isArray(data.results)) return send(502, { message: 'Audiomack returned an unexpected search response.' });
      const body = { tracks: data.results.map(normalizeTrack).filter(Boolean), hasMore: Number.isFinite(Number(data.count)) ? page * 20 < Number(data.count) : data.results.length === 20 };
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, { body, expires: Date.now() + 60000 });
      send(200, body);
    } catch { send(502, { message: 'Could not reach Audiomack. Please try again.' }); }
  };
}
