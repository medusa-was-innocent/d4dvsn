import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapterHold, chapterState } from '../src/services/scrollTiming.js';

const segments = [0, 160, 300].map(overflow => ({ hold: 300, overflow, length: 300 + overflow }));

test('chapter timing is responsive and bounded on short phones and large displays', () => {
  assert.equal(chapterHold(400), 260);
  assert.equal(chapterHold(800), 416);
  assert.equal(chapterHold(1600), 560);
});
test('every chapter triggers forward, backward and after a large scroll jump', () => {
  assert.equal(chapterState(segments, 0).index, 0);
  assert.equal(chapterState(segments, 300).index, 1);
  assert.equal(chapterState(segments, 760).index, 2);
  assert.equal(chapterState(segments, 10000).index, 2);
  assert.equal(chapterState(segments, 0, 2).index, 0);
});
test('small reverse trackpad movements do not flicker between chapters', () => {
  assert.equal(chapterState(segments, 299, 1).index, 1);
  assert.equal(chapterState(segments, 287, 1).index, 1);
  assert.equal(chapterState(segments, 285, 1).index, 0);
  assert.equal(chapterState(segments, 299, 1).progress, 0);
});
test('long text reaches its bottom before the next chapter and stays clamped', () => {
  assert.equal(chapterState(segments, 759, 1).pan, 160);
  assert.equal(chapterState(segments, 1360, 2).pan, 300);
  assert.deepEqual(chapterState(segments, -100), { index: 0, pan: 0, progress: 0 });
  assert.deepEqual(chapterState([], 10), { index: 0, pan: 0, progress: 0 });
});
