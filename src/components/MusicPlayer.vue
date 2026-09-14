<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { searchTracks, parseAudiomackLink, PAGE_SIZE } from '@/services/musicCatalog';

const card = ref(null);
const audio = ref(null);
const filePicker = ref(null);
const searchInput = ref(null);
const expandButton = ref(null);
const expanded = ref(false);
const query = ref('');
const notice = ref('');
const searching = ref(false);
const results = ref([]);
const library = ref([]);
const selected = ref(null);
const embedded = ref(null);
const searchReady = ref(false);
const checkingSearch = ref(true);
const isSongLink = computed(() => Boolean(parseAudiomackLink(query.value.trim())));
const hasMore = ref(false);
const searchedQuery = ref('');
let resultOffset = 0;
const playing = ref(false);
const busy = ref(false);
const elapsed = ref(0);
const duration = ref(0);
const volume = ref(0.65);
const position = ref(null);
const dragging = ref(false);
const wave = ref('M 0 12 L 60 12');
let dragStart = null;
let resizeObserver;
let motionPreference;
let animationFrame = 0;
let requestController;
let playAttempt = 0;

const cardStyle = computed(() => position.value
  ? { left: `${position.value.x}px`, top: `${position.value.y}px`, right: 'auto', bottom: 'auto' }
  : {});
const currentTitle = computed(() => embedded.value?.title || selected.value?.title || 'A little music?');
const filteredLibrary = computed(() => library.value.filter(track => track.title.toLowerCase().includes(query.value.trim().toLowerCase())));
const playLabel = computed(() => {
  if (embedded.value) return 'Open Audiomack playback controls';
  if (!selected.value) return 'Choose music';
  return playing.value ? 'Pause music' : 'Play music';
});

function keepInView() {
  if (!card.value || !position.value) return;
  const bounds = card.value.getBoundingClientRect();
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft || 0;
  const top = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  position.value = {
    x: Math.max(left + 12, Math.min(position.value.x, left + width - bounds.width - 12)),
    y: Math.max(top + 12, Math.min(position.value.y, top + height - bounds.height - 12)),
  };
}

function startDrag(event) {
  if (!event.isPrimary || event.button !== 0) return;
  const bounds = card.value.getBoundingClientRect();
  position.value = { x: bounds.left, y: bounds.top };
  dragStart = { pointer: event.pointerId, ...position.value, pointerX: event.clientX, pointerY: event.clientY };
  dragging.value = true;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!dragStart || dragStart.pointer !== event.pointerId) return;
  position.value = {
    x: dragStart.x + event.clientX - dragStart.pointerX,
    y: dragStart.y + event.clientY - dragStart.pointerY,
  };
  keepInView();
}

function endDrag() {
  dragging.value = false;
  dragStart = null;
}

function moveWithKeyboard(event) {
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (event.key === 'Home') {
    event.preventDefault();
    position.value = null;
    return;
  }
  if (!directions[event.key]) return;
  event.preventDefault();
  const bounds = card.value.getBoundingClientRect();
  const [x, y] = directions[event.key];
  const step = event.shiftKey ? 40 : 12;
  position.value = { x: bounds.left + x * step, y: bounds.top + y * step };
  keepInView();
}

async function toggleExpanded(force) {
  expanded.value = typeof force === 'boolean' ? force : !expanded.value;
  await nextTick();
  keepInView();
  if (expanded.value && !selected.value && !embedded.value) searchInput.value?.focus({ preventScroll: true });
  else if (!expanded.value) expandButton.value?.focus({ preventScroll: true });
}

function animateWave(time = 0) {
  if (!playing.value) return;
  const phase = motionPreference?.matches ? 0 : time / 180;
  wave.value = Array.from({ length: 31 }, (_, i) => {
    const x = i * 2;
    const envelope = Math.sin((i / 30) * Math.PI);
    const y = 12 + Math.sin(i * 0.62 - phase) * envelope * 7;
    return `${i ? 'L' : 'M'} ${x} ${y.toFixed(2)}`;
  }).join(' ');
  if (!motionPreference?.matches) animationFrame = requestAnimationFrame(animateWave);
}

function syncWave() {
  cancelAnimationFrame(animationFrame);
  if (playing.value) animateWave();
  else wave.value = 'M 0 12 L 60 12';
}

watch(playing, syncWave);
watch(volume, value => { if (audio.value) audio.value.volume = Number(value); });

function stopLocalAudio() {
  ++playAttempt;
  audio.value?.pause();
  playing.value = false;
  busy.value = false;
}

async function togglePlayback() {
  if (embedded.value) return toggleExpanded(true);
  if (!selected.value) return toggleExpanded(true);
  if (!audio.value.paused) return stopLocalAudio();
  const attempt = ++playAttempt;
  busy.value = true;
  notice.value = '';
  try {
    await audio.value.play();
  } catch (error) {
    if (attempt !== playAttempt) return;
    playing.value = false;
    busy.value = false;
    notice.value = error.name === 'NotAllowedError'
      ? 'Tap play again to let your browser start the music.'
      : 'This track could not play. Please choose another result.';
  }
}

async function selectLocal(track, startPlaying = false) {
  stopLocalAudio();
  embedded.value = null;
  selected.value = track;
  elapsed.value = 0;
  duration.value = 0;
  notice.value = startPlaying ? '' : 'Ready when you are. Tap the line to play.';
  await nextTick();
  audio.value.volume = Number(volume.value);
  audio.value.load();
  keepInView();
  if (startPlaying) await togglePlayback();
}

function chooseFiles(event) {
  const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i.test(file.name));
  if (!files.length) {
    notice.value = 'Choose an audio file such as MP3, M4A or WAV.';
    return;
  }
  const tracks = files.map(file => ({ title: file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) }));
  library.value.push(...tracks);
  query.value = '';
  selectLocal(tracks[0]);
  event.target.value = '';
}

async function searchCatalog(more = false) {
  if (!query.value.trim()) return;
  const link = parseAudiomackLink(query.value.trim());
  if (link) return selectAudiomack(link);
  more = more === true && searchedQuery.value === query.value.trim();
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  const timeout = window.setTimeout(() => controller.abort('timeout'), 15000);
  searching.value = true;
  notice.value = '';
  if (!more) {
    results.value = [];
    resultOffset = 0;
    hasMore.value = false;
  }
  const term = query.value.trim();
  try {
    const data = await searchTracks(term, { offset: resultOffset, signal: controller.signal });
    if (requestController !== controller) return;
    results.value = [...new Map([...results.value, ...data.tracks].map(track => [track.id, track])).values()];
    searchedQuery.value = term;
    resultOffset += PAGE_SIZE;
    hasMore.value = data.hasMore;
    if (!results.value.length) notice.value = 'No matching songs from verified Audiomack uploaders. Try another title or artist.';
  } catch (error) {
    if (requestController === controller) notice.value = controller.signal.reason === 'timeout' ? 'Search took too long. Please try again.' : error.name === 'AbortError' ? '' : error.message;
  } finally {
    window.clearTimeout(timeout);
    if (requestController === controller) searching.value = false;
  }
}

function selectAudiomack(track) {
  const link = parseAudiomackLink(track.url);
  if (!link) return;
  stopLocalAudio();
  selected.value = null;
  embedded.value = { ...track, ...link, title: track.title, artist: track.artist || link.artist };
  notice.value = '';
  nextTick(keepInView);
}

watch(query, () => {
  requestController?.abort();
  requestController = null;
  searching.value = false;
  hasMore.value = false;
  results.value = [];
  notice.value = '';
}, { flush: 'sync' });

function clearMusic() {
  stopLocalAudio();
  selected.value = null;
  embedded.value = null;
  elapsed.value = 0;
  duration.value = 0;
  notice.value = '';
}

function timeLabel(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

onMounted(() => {
  fetch('/api/music/status', { signal: AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : null)
    .then(data => { searchReady.value = data?.configured === true; })
    .catch(() => { searchReady.value = false; })
    .finally(() => { checkingSearch.value = false; });
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionPreference.addEventListener('change', syncWave);
  resizeObserver = new ResizeObserver(keepInView);
  resizeObserver.observe(card.value);
  window.addEventListener('resize', keepInView);
  window.visualViewport?.addEventListener('resize', keepInView);
  window.visualViewport?.addEventListener('scroll', keepInView);
});

onBeforeUnmount(() => {
  stopLocalAudio();
  cancelAnimationFrame(animationFrame);
  requestController?.abort();
  library.value.forEach(track => URL.revokeObjectURL(track.url));
  resizeObserver?.disconnect();
  motionPreference?.removeEventListener('change', syncWave);
  window.removeEventListener('resize', keepInView);
  window.visualViewport?.removeEventListener('resize', keepInView);
  window.visualViewport?.removeEventListener('scroll', keepInView);
});
</script>

<template>
  <aside ref="card" class="music-card glass-panel" :class="{ 'is-expanded': expanded, 'is-dragging': dragging }" :style="cardStyle" aria-label="Music player" @keydown.esc="toggleExpanded(false)">
    <div class="music-toolbar">
      <button class="wave-button" type="button" :aria-label="playLabel" :aria-pressed="selected ? playing : undefined" :aria-busy="busy" @click="togglePlayback">
        <svg viewBox="0 0 60 24" width="60" height="24" aria-hidden="true"><path :d="wave" /></svg>
      </button>
      <button class="drag-handle" type="button" aria-label="Move music player. Drag or use arrow keys; Home resets position." title="Drag to move · arrow keys also work" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" @keydown="moveWithKeyboard">
        <span class="player-label">{{ expanded ? 'SOUNDTRACK' : 'MUSIC' }}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true"><circle v-for="n in 6" :key="n" :cx="n % 2 ? 4 : 8" :cy="Math.ceil(n / 2) * 4 - 2" r="1" /></svg>
      </button>
      <button ref="expandButton" class="icon-button expand-button" type="button" :aria-label="expanded ? 'Minimize music player' : 'Choose music'" :aria-expanded="expanded" aria-controls="music-panel" @click="toggleExpanded()">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path :d="expanded ? 'M5 10h10' : 'M10 5v10M5 10h10'" /></svg>
      </button>
    </div>

    <div v-show="expanded" id="music-panel" class="music-panel" @wheel.stop @touchmove.stop>
      <div class="track-heading"><p>{{ currentTitle }}</p><button v-if="selected || embedded" class="text-button" type="button" @click="clearMusic">Clear</button></div>
      <p class="music-caption">{{ embedded?.artist || selected?.artist || 'Audiomack · Your choice of music' }}</p>
      <form class="music-search" role="search" @submit.prevent="searchCatalog()">
        <label class="sr-only" for="music-search-input">Search Audiomack or open a song link</label>
        <input ref="searchInput" id="music-search-input" v-model="query" type="search" :placeholder="searchReady ? 'Search songs or artists…' : 'Audiomack song link'" autocomplete="off" maxlength="1000" />
        <button class="search-action" type="submit" :disabled="searching || !query.trim() || (!searchReady && !isSongLink)">{{ searching ? '…' : isSongLink ? 'Open' : 'Search' }}</button>
      </form>
      <p v-if="checkingSearch" class="music-hint">Checking Audiomack connection…</p>
      <p v-else-if="!searchReady" class="music-hint" role="status">Audiomack search isn’t connected yet: it requires the owner’s application credentials. Song links can still open in the player below.</p>
      <p v-else class="music-hint">Audiomack songs · verified uploaders only.</p>
      <p v-if="notice" class="music-notice" role="status">{{ notice }}</p>
      <p class="sr-only" role="status">{{ searching ? 'Searching music' : results.length ? `${results.length} playable results` : '' }}</p>
      <ul v-if="results.length" class="music-results" aria-label="Audiomack search results" :aria-busy="searching">
        <li v-for="track in results" :key="track.id"><button class="catalog-result" type="button" :aria-label="`Open ${track.title} by ${track.artist}`" :aria-pressed="embedded?.url === track.url" @click="selectAudiomack(track)">
          <img v-if="track.artwork" :src="track.artwork" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer" />
          <span v-else class="artwork-placeholder" aria-hidden="true">♪</span>
          <span class="result-copy"><span>{{ track.title }}</span><small>{{ track.artist }}</small></span>
          <span class="result-play" aria-hidden="true">▶</span>
        </button></li>
      </ul>
      <button v-if="hasMore" class="more-results" type="button" :disabled="searching" @click="searchCatalog(true)">{{ searching ? 'Loading…' : 'Show more results' }}</button>

      <div v-if="embedded" class="audiomack-player">
        <iframe :key="embedded.embedUrl" :src="embedded.embedUrl" :title="`Audiomack: ${embedded.title}`" :height="embedded.type === 'song' ? 252 : 352" width="100%" scrolling="no" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        <p class="music-hint">Play and pause with Audiomack’s controls. <a :href="embedded.url" target="_blank" rel="noopener noreferrer">Open song ↗</a></p>
      </div>

      <div v-if="selected" class="local-controls">
        <div class="now-playing"><button type="button" class="play-control" :aria-label="playLabel" @click="togglePlayback">{{ busy ? 'Loading…' : playing ? 'Pause' : 'Play' }}</button><span>On your device</span></div>
        <div class="progress-labels"><span>{{ timeLabel(elapsed) }}</span><span>{{ timeLabel(duration) }}</span></div>
        <input class="seek-control" type="range" aria-label="Playback position" min="0" :max="duration || 1" step="0.1" :value="elapsed" :disabled="!duration" @input="audio.currentTime = Number($event.target.value)" />
        <div class="volume-controls"><span>Volume</span><input v-model="volume" aria-label="Music volume" type="range" min="0" max="1" step="0.01" /></div>
      </div>

      <ul v-if="filteredLibrary.length" class="music-results local-library" aria-label="Your music files">
        <li v-for="track in filteredLibrary" :key="track.url"><button type="button" :aria-pressed="selected?.url === track.url" @click="selectLocal(track)"><span>{{ track.title }}</span><small>{{ selected?.url === track.url ? 'Selected' : 'From your device' }}</small></button></li>
      </ul>
      <div class="music-footer"><button class="text-button" type="button" @click="filePicker.click()">Choose from device</button><a href="https://audiomack.com" target="_blank" rel="noopener noreferrer">Audiomack ↗</a></div>
      <input ref="filePicker" class="sr-only" type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus" multiple tabindex="-1" aria-label="Choose local music files" @change="chooseFiles" />
    </div>

    <audio ref="audio" :src="selected?.url" preload="none" @playing="playing = true; busy = false" @pause="playing = false; busy = false" @waiting="playing = false; busy = true" @ended="playing = false; busy = false" @timeupdate="elapsed = audio.currentTime" @loadedmetadata="duration = Number.isFinite(audio.duration) ? audio.duration : 0" @error="playing = false; busy = false; notice = selected ? 'This track is unavailable. Please choose another result or a device file.' : ''" />
  </aside>
</template>

<style scoped>
.music-card {
  position: fixed;
  z-index: 80;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  width: 200px;
  max-width: calc(100dvw - 24px);
  max-height: calc(100dvh - 24px);
  color: #fffaf0;
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --glass-tint: rgb(27 33 40 / 32%);
  --glass-solid: #343b44;
  border-radius: 26px;
  isolation: isolate;
  overflow: hidden;
}
.music-card.is-expanded { width: 360px; border-radius: 28px; --glass-tint: rgb(25 32 39 / 55%); }
.music-card.is-dragging { user-select: none; box-shadow: 0 18px 50px rgb(0 0 0 / 32%); }
.music-toolbar { display: flex; align-items: center; gap: 2px; padding: 5px; }
.music-card button, .music-card a, .music-card input { -webkit-tap-highlight-color: transparent; }
.music-card button, .music-card a { color: inherit; }
.music-card button { cursor: pointer; }
.music-card button:focus-visible, .music-card a:focus-visible, .music-card input:focus-visible { outline: 2px solid #eab98c; outline-offset: 3px; }
.wave-button { height: 42px; width: 78px; display: grid; place-items: center; flex-shrink: 0; border-radius: 22px; background: linear-gradient(150deg, #ffffff35, #ffffff0a); box-shadow: inset 0 1px 1px #ffffff75, inset 0 -1px 1px #ffffff20; }
.wave-button:hover, .icon-button:hover { background: rgb(255 255 255 / 15%); }
.wave-button svg { display: block; }
.wave-button path { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.wave-button[aria-busy='true'] { opacity: .55; }
.drag-handle { display: flex; align-items: center; justify-content: center; gap: 9px; flex: 1; min-width: 0; height: 42px; cursor: grab !important; touch-action: none; }
.is-dragging .drag-handle { cursor: grabbing !important; }
.player-label { font-size: 10px; font-weight: 600; letter-spacing: .13em; }
.drag-handle svg { opacity: .45; flex-shrink: 0; }
.icon-button { display: grid; place-items: center; width: 38px; height: 42px; border-radius: 50%; flex-shrink: 0; }
.music-panel { padding: 3px 18px 17px; overflow-y: auto; max-height: calc(100dvh - 90px); overscroll-behavior: contain; }
.track-heading { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.track-heading p { min-width: 0; flex: 1; font-size: 17px; font-weight: 500; text-wrap: pretty; overflow-wrap: anywhere; }
.music-caption { color: #d3cbc5; margin: 3px 0 17px; }
.music-search { margin-top: 15px; display: flex; align-items: center; gap: 4px; background: rgb(255 255 255 / 8%); border: 1px solid rgb(255 255 255 / 15%); border-radius: 13px; padding: 3px 4px 3px 12px; }
.music-search input { color: inherit; min-width: 0; width: 100%; background: transparent; border: 0; height: 38px; font: inherit; }
.music-search input::placeholder { color: #c3bcb7; font-size: 12px; }
.search-action { flex-shrink: 0; display: grid; place-items: center; min-width: 46px; min-height: 36px; padding: 0 8px; font-size: 11px; border-radius: 9px; background: rgb(255 255 255 / 12%); text-decoration: none; }
.search-action:disabled { opacity: .4; }
.music-hint { font-size: 11px; line-height: 1.55; color: #c8c1bd; margin: 8px 0 0; }
.music-hint a { text-decoration: underline; text-underline-offset: 3px; }
.music-notice { font-size: 12px; color: #eed0b3; margin: 11px 0; }
.music-results { list-style: none; padding: 0; margin: 12px 0; max-height: min(260px, 32dvh); overflow-y: auto; overscroll-behavior: contain; }
.music-results button { text-align: left; width: 100%; padding: 9px 10px; border-radius: 10px; }
.music-results button:hover, .music-results button[aria-pressed='true'] { background: rgb(255 255 255 / 9%); }
.music-results span, .music-results small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.music-results small { color: #bfb6b1; font-size: 10px; margin-top: 1px; }
.catalog-result { display: flex; align-items: center; gap: 10px; }
.catalog-result img, .artwork-placeholder { width: 40px; height: 40px; border-radius: 9px; object-fit: cover; flex-shrink: 0; background: #ffffff18; }
.artwork-placeholder { text-align: center; padding-top: 9px; }
.result-copy { min-width: 0; flex: 1; }
.result-play { font-size: 11px; padding: 4px; opacity: .85; }
.more-results, .play-control { padding: 7px 12px; border: 1px solid #ffffff35; border-radius: 999px; background: linear-gradient(160deg, #ffffff26, #ffffff08); font-size: 11px; }
.audiomack-player { margin-top: 16px; }
.audiomack-player iframe { display: block; width: 100%; border: 0; border-radius: 14px; background: #161616; }
.more-results { display: block; margin: 0 auto; }
.more-results:disabled { opacity: .5; }
.now-playing { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; font-size: 10px; }
.play-control { min-width: 70px; }
.local-controls { margin-top: 19px; }
.progress-labels { display: flex; justify-content: space-between; color: #c5bcb6; font-size: 10px; font-variant-numeric: tabular-nums; }
.seek-control { width: 100%; accent-color: #e5bf9a; height: 24px; cursor: pointer; }
.volume-controls { display: flex; align-items: center; gap: 14px; margin-top: 5px; font-size: 11px; color: #c5bcb6; }
.volume-controls input { flex: 1; width: 100%; min-width: 0; height: 24px; accent-color: #e5bf9a; cursor: pointer; }
.music-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-top: 16px; padding-top: 13px; border-top: 1px solid rgb(255 255 255 / 12%); font-size: 10px; color: #d7cbc1; }
.music-footer a { text-decoration: none; }
.music-footer a:hover, .text-button:hover { text-decoration: underline; text-underline-offset: 3px; }
.text-button { font: inherit; flex-shrink: 0; }
.track-heading .text-button { color: #c5bcb6; font-size: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 600px) { .music-card { right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); } }
@media (prefers-reduced-transparency: reduce) { .music-card { background: #262329; backdrop-filter: none; -webkit-backdrop-filter: none; } }
</style>
