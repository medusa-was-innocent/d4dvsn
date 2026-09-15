import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePublicTrack, streamUrl, searchTracks } from '../src/services/musicCatalog.js';
import { nextPlayerMode, PLAYER_IDLE_MS } from '../src/services/playerUi.js';

test('player cycles from circle to bar to panel and back to bar', () => {
  assert.equal(nextPlayerMode('bubble'), 'bar');
  assert.equal(nextPlayerMode('bar'), 'expanded');
  assert.equal(nextPlayerMode('expanded'), 'bar');
  assert.equal(PLAYER_IDLE_MS, 7000);
});
test('only public, unrestricted music is playable', () => {
  const track = { id: 'Ab12', title: 'Test', user: { name: 'Artist' }, access: { stream: true } };
  assert.equal(normalizePublicTrack(track).source, 'audius');
  for (const extra of [{ is_stream_gated: true }, { is_available: false }, { is_unlisted: true }, { access: { stream: false } }, { stream_conditions: { follow_user_id: 123 } }]) {
    assert.equal(normalizePublicTrack({ ...track, ...extra }), null);
  }
  assert.throws(() => streamUrl('../secret'));
  assert.throws(() => streamUrl(undefined));
  assert.equal(normalizePublicTrack({ title: 'Missing ID' }), null);
});
test('catalog encodes search and pagination without credentials or promoted feeds', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/v1/tracks/search');
    assert.equal(parsed.searchParams.get('query'), 'a & b');
    assert.equal(parsed.searchParams.get('offset'), '20');
    return { ok: true, json: async () => ({ data: [{ id: 'x1', title: 'Song' }] }) };
  });
  const result = await searchTracks('a & b', { offset: 20 });
  assert.equal(result.tracks.length, 1);
  assert.equal(result.hasMore, false);
});
