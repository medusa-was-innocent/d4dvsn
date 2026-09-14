<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Optional same-origin search service. Audiomack consumer secrets must stay on a server.
const props = defineProps({ searchEndpoint: { type: String, default: '' } });

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
const searchHref = computed(() => `https://audiomack.com/search?q=${encodeURIComponent(query.value.trim())}`);
const looksLikeLink = computed(() => /^(https?:\/\/|(?:www\.)?audiomack\.com\/)/i.test(query.value.trim()));
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
  if (embedded.value || !selected.value) return toggleExpanded(true);
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
      : 'This audio could not play. Try another file.';
  }
}

async function selectLocal(track) {
  stopLocalAudio();
  embedded.value = null;
  selected.value = track;
  elapsed.value = 0;
  duration.value = 0;
  notice.value = 'Ready when you are. Tap the line to play.';
  await nextTick();
  audio.value.volume = Number(volume.value);
  audio.value.load();
  keepInView();
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

function parseAudiomackLink(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['audiomack.com', 'www.audiomack.com'].includes(url.hostname) || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed') parts.shift();
    if (parts.length !== 3) return null;
    // Accept current /artist/song/title and earlier /song/artist/title share links.
    const types = ['song', 'album', 'playlist'];
    const [artist, type, slug] = types.includes(parts[0]) ? [parts[1], parts[0], parts[2]] : parts;
    if (!types.includes(type) || !artist || !slug) return null;
    const path = [artist, type, slug].join('/');
    return {
      title: decodeURIComponent(slug).replace(/-/g, ' '),
      url: `https://audiomack.com/${path}`,
      embedUrl: `https://audiomack.com/embed/${path}`,
      type,
    };
  } catch { return null; }
}

function loadAudiomack(value = query.value) {
  const track = parseAudiomackLink(value.trim());
  if (!track) {
    notice.value = 'Paste an Audiomack song, album or playlist link.';
    return;
  }
  stopLocalAudio();
  selected.value = null;
  embedded.value = track;
  notice.value = '';
  results.value = [];
  toggleExpanded(true);
}

async function searchCatalog() {
  if (looksLikeLink.value) return loadAudiomack();
  if (!query.value.trim()) return;
  if (!props.searchEndpoint) {
    window.open(searchHref.value, '_blank', 'noopener,noreferrer');
    return;
  }
  // A deployment may supply a server route returning { results: [{ title, artist, url }] }.
  // Never call the signed Audiomack Data API directly from the browser.
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  searching.value = true;
  notice.value = '';
  results.value = [];
  try {
    const endpoint = new URL(props.searchEndpoint, window.location.origin);
    if (endpoint.origin !== window.location.origin) throw new Error('Use a same-origin music search service.');
    endpoint.searchParams.set('q', query.value.trim());
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error('Audiomack search is unavailable. Use “Find on Audiomack” below.');
    const data = await response.json();
    if (requestController !== controller) return;
    results.value = (Array.isArray(data.results) ? data.results : []).filter(track => typeof track.url === 'string' && parseAudiomackLink(track.url)).slice(0, 12);
    if (!results.value.length) notice.value = 'No songs found. Try another artist or title.';
  } catch (error) {
    if (error.name !== 'AbortError') notice.value = error.message;
  } finally {
    if (requestController === controller) searching.value = false;
  }
}

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
  <aside ref="card" class="music-card" :class="{ 'is-expanded': expanded, 'is-dragging': dragging }" :style="cardStyle" aria-label="Music player" @keydown.esc="toggleExpanded(false)">
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
      <p class="music-caption" v-if="!selected && !embedded">Set the mood while you explore.</p>
      <form class="music-search" @submit.prevent="searchCatalog">
        <label class="sr-only" for="music-search-input">Find music or paste an Audiomack link</label>
        <input ref="searchInput" id="music-search-input" v-model="query" type="search" placeholder="Artist, song or Audiomack link" autocomplete="off" maxlength="1000" />
        <button v-if="looksLikeLink || props.searchEndpoint" class="search-action" type="submit" :disabled="searching || !query.trim()">{{ looksLikeLink ? 'Load' : searching ? '…' : 'Search' }}</button>
        <a v-else class="search-action" :href="searchHref" target="_blank" rel="noopener noreferrer" aria-label="Find music on Audiomack, opens in a new tab">Find ↗</a>
      </form>
      <p v-if="!props.searchEndpoint" class="music-hint">Find a track on Audiomack, then paste its share link here.</p>
      <p v-if="notice" class="music-notice" role="status">{{ notice }}</p>

      <ul v-if="results.length" class="music-results" aria-label="Audiomack search results">
        <li v-for="track in results" :key="track.url"><button type="button" @click="loadAudiomack(track.url)"><span>{{ track.title }}</span><small>{{ track.artist }}</small></button></li>
      </ul>

      <div v-if="embedded" class="audiomack-embed">
        <iframe :key="embedded.embedUrl" :src="embedded.embedUrl" :title="`Audiomack player: ${embedded.title}`" :height="embedded.type === 'song' ? 252 : 352" width="100%" scrolling="no" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media" />
        <p class="music-hint">Play and pause with the Audiomack controls. <a :href="embedded.url" target="_blank" rel="noopener noreferrer">Open track ↗</a></p>
      </div>

      <div v-if="selected" class="local-controls">
        <div class="progress-labels"><span>{{ timeLabel(elapsed) }}</span><span>{{ timeLabel(duration) }}</span></div>
        <input class="seek-control" type="range" aria-label="Playback position" min="0" :max="duration || 1" step="0.1" :value="elapsed" :disabled="!duration" @input="audio.currentTime = Number($event.target.value)" />
        <div class="volume-controls"><span>Volume</span><input v-model="volume" aria-label="Music volume" type="range" min="0" max="1" step="0.01" /></div>
      </div>

      <ul v-if="filteredLibrary.length" class="music-results local-library" aria-label="Your music files">
        <li v-for="track in filteredLibrary" :key="track.url"><button type="button" :aria-pressed="selected?.url === track.url" @click="selectLocal(track)"><span>{{ track.title }}</span><small>{{ selected?.url === track.url ? 'Selected' : 'From your device' }}</small></button></li>
      </ul>
      <div class="music-footer"><button class="text-button" type="button" @click="filePicker.click()">Choose from device</button><a :href="searchHref" target="_blank" rel="noopener noreferrer">Find on Audiomack ↗</a></div>
      <input ref="filePicker" class="sr-only" type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus" multiple tabindex="-1" aria-label="Choose local music files" @change="chooseFiles" />
    </div>

    <audio ref="audio" :src="selected?.url" preload="metadata" @playing="playing = true; busy = false" @pause="playing = false; busy = false" @waiting="playing = false; busy = true" @ended="playing = false; busy = false" @timeupdate="elapsed = audio.currentTime" @loadedmetadata="duration = Number.isFinite(audio.duration) ? audio.duration : 0" @error="playing = false; busy = false; notice = selected ? 'This audio could not play. Try another file.' : ''" />
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
  background: linear-gradient(130deg, rgb(47 40 39 / 83%), rgb(25 24 31 / 87%));
  border: 1px solid rgb(255 255 255 / 29%);
  border-radius: 26px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 15%), 0 12px 40px rgb(0 0 0 / 22%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
  backdrop-filter: blur(22px) saturate(145%);
  isolation: isolate;
  overflow: hidden;
}
.music-card.is-expanded { width: 344px; border-radius: 24px; }
.music-card.is-dragging { user-select: none; box-shadow: 0 18px 50px rgb(0 0 0 / 32%); }
.music-toolbar { display: flex; align-items: center; gap: 2px; padding: 5px; }
.music-card button, .music-card a, .music-card input { -webkit-tap-highlight-color: transparent; }
.music-card button, .music-card a { color: inherit; }
.music-card button { cursor: pointer; }
.music-card button:focus-visible, .music-card a:focus-visible, .music-card input:focus-visible { outline: 2px solid #eab98c; outline-offset: 3px; }
.wave-button { height: 42px; width: 78px; display: grid; place-items: center; flex-shrink: 0; border-radius: 22px; background: rgb(255 255 255 / 6%); }
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
.music-results { list-style: none; padding: 0; margin: 12px 0; max-height: 190px; overflow-y: auto; overscroll-behavior: contain; }
.music-results button { text-align: left; width: 100%; padding: 9px 10px; border-radius: 10px; }
.music-results button:hover, .music-results button[aria-pressed='true'] { background: rgb(255 255 255 / 9%); }
.music-results span, .music-results small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.music-results small { color: #bfb6b1; font-size: 10px; margin-top: 1px; }
.audiomack-embed { margin-top: 15px; }
.audiomack-embed iframe { display: block; width: 100%; border: 0; border-radius: 12px; background: #fff; }
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
