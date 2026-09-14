import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAudiomackLink } from '../src/services/musicCatalog.js';
import { authorization, normalizeTrack, createAudiomackMiddleware } from '../server/audiomack.mjs';

test('only accepts official Audiomack song, album and playlist links', () => {
  assert.equal(parseAudiomackLink('https://audiomack.com/artist/song/title').embedUrl, 'https://audiomack.com/embed/artist/song/title');
  assert.equal(parseAudiomackLink('https://audiomack.com/song/artist/title').url, 'https://audiomack.com/artist/song/title');
  assert.equal(parseAudiomackLink('audiomack.com/artist/album/title').type, 'album');
  for (const value of ['https://evil.com/a/song/b', 'https://audiomack.com.evil.com/a/song/b', 'https://user:pass@audiomack.com/a/song/b', 'javascript:alert(1)', 'https://audiomack.com/search']) assert.equal(parseAudiomackLink(value), null);
});

test('normalizes documented music entities into official embeds', () => {
  const result = normalizeTrack({ id: 1, title: 'Song', type: 'song', artist: 'Artist', url_slug: 'song-title', uploader: { url_slug: 'uploader' } });
  assert.equal(result.embedUrl, 'https://audiomack.com/embed/uploader/song/song-title');
  assert.equal(result.artist, 'Artist');
  assert.equal(normalizeTrack({ id: 1, type: 'artist' }), null);
});

test('OAuth signing is deterministic and never sends the consumer secret', () => {
  const url = new URL('https://api.audiomack.com/v1/search?q=A%26B&show=songs');
  const header = authorization(url, 'example-key', 'example-secret', { nonce: 'fixed', timestamp: 100 });
  assert.equal(header, authorization(url, 'example-key', 'example-secret', { nonce: 'fixed', timestamp: 100 }));
  assert.match(header, /oauth_signature_method="HMAC-SHA1"/);
  assert.match(header, /oauth_signature="[^"]+"/);
  assert.ok(!header.includes('example-secret'));
});

async function request(middleware, path) {
  let status, body;
  await middleware({ method: 'GET', url: path }, { writeHead(code) { status = code; }, end(text) { body = JSON.parse(text); } }, () => { throw new Error('Unexpected next'); });
  return { status, body };
}

test('missing application credentials fail clearly without an upstream request', async () => {
  const middleware = createAudiomackMiddleware({}, () => { throw new Error('Must not call upstream'); });
  assert.deepEqual(await request(middleware, '/api/music/status'), { status: 200, body: { configured: false } });
  assert.equal((await request(middleware, '/api/music/search?q=test')).status, 503);
});

test('configured search signs requests, requests verified songs and paginates', async () => {
  const middleware = createAudiomackMiddleware({ AUDIOMACK_CONSUMER_KEY: 'test-key', AUDIOMACK_CONSUMER_SECRET: 'test-secret' }, async (url, options) => {
    assert.equal(url.origin, 'https://api.audiomack.com');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('verified'), '1');
    assert.match(options.headers.Authorization, /^OAuth /);
    return { ok: true, json: async () => ({ results: [{ id: 1, title: 'Song', type: 'song', artist: 'Artist', url_slug: 'song', uploader: { url_slug: 'artist' } }], count: 50 }) };
  });
  const result = await request(middleware, '/api/music/search?q=test&page=2');
  assert.equal(result.status, 200);
  assert.equal(result.body.tracks.length, 1);
  assert.equal(result.body.hasMore, true);
  assert.equal((await request(middleware, '/api/music/search?q=test&page=-1')).status, 400);
});
