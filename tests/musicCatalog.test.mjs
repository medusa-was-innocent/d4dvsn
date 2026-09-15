import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorization, normalizeTrack, createAudiomackMiddleware } from '../server/audiomack.mjs';

test('normalizes documented music entities without exposing expiring audio sources', () => {
  const result = normalizeTrack({ id: 1, title: 'Song', type: 'song', artist: 'Artist', url_slug: 'song-title', uploader: { url_slug: 'uploader' } });
  assert.equal(result.permalink, 'https://audiomack.com/uploader/song/song-title');
  assert.equal(result.source, 'audiomack');
  assert.equal(result.url, undefined);
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

async function request(middleware, path, method = 'GET', headers = {}) {
  let status, body;
  await middleware({ method, url: path, headers }, { writeHead(code) { status = code; }, end(text) { body = JSON.parse(text); } }, () => { throw new Error('Unexpected next'); });
  return { status, body };
}

test('missing application credentials fail clearly without an upstream request', async () => {
  const middleware = createAudiomackMiddleware({}, () => { throw new Error('Must not call upstream'); });
  assert.deepEqual(await request(middleware, '/api/music/status'), { status: 200, body: { configured: false } });
  assert.equal((await request(middleware, '/api/music/search?q=test')).status, 503);
});

test('direct playback gets stats authorization and a fresh signed streaming source', async () => {
  const calls = [];
  const middleware = createAudiomackMiddleware({ AUDIOMACK_CONSUMER_KEY: 'test-key', AUDIOMACK_CONSUMER_SECRET: 'test-secret' }, async (url, options) => {
    calls.push(url.pathname);
    if (url.pathname.endsWith('/stats/token')) return { ok: true };
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('session'), '01234567-89ab-cdef-0123-456789abcdef');
    assert.match(options.headers.Authorization, /oauth_signature=/);
    return { ok: true, json: async () => 'https://songs.audiomack.com/streaming/test.mp3' };
  });
  const path = '/api/music/play/123?session=01234567-89ab-cdef-0123-456789abcdef';
  assert.equal((await request(middleware, path)).status, 405);
  assert.equal((await request(middleware, path, 'POST')).status, 403);
  const result = await request(middleware, path, 'POST', { 'x-portfolio-player': '1' });
  assert.equal(result.status, 200);
  assert.match(result.body.url, /^https:\/\//);
  assert.deepEqual(calls, ['/v1/music/stats/token', '/v1/music/123/play']);
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
