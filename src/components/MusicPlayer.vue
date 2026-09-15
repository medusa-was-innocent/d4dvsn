<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { searchTracks, streamUrl, PAGE_SIZE } from '@/services/musicCatalog';
import { nextPlayerMode, PLAYER_IDLE_MS } from '@/services/playerUi';

const card = ref(null);
const audio = ref(null);
const filePicker = ref(null);
const searchInput = ref(null);
const expandButton = ref(null);
const mode = ref('bubble');
const expanded = computed(() => mode.value === 'expanded');
const bubbleButton = ref(null);
const rolling = ref(false);
let suppressBubbleClick = false;
let disposed = false;
let idleTimer;
const query = ref('');
const notice = ref('');
const searching = ref(false);
const results = ref([]);
const library = ref([]);
const selected = ref(null);
const queue = ref([]);
const queueIndex = computed(() => queue.value.findIndex(track => selected.value?.id ? track.id === selected.value.id : track.url === selected.value?.url));
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
const currentTitle = computed(() => selected.value?.title || 'Your soundtrack');
const filteredLibrary = computed(() => library.value.filter(track => track.title.toLowerCase().includes(query.value.trim().toLowerCase())));
const playLabel = computed(() => {
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
  suppressBubbleClick = false;
  dragStart = { pointer: event.pointerId, ...position.value, pointerX: event.clientX, pointerY: event.clientY, moved: false };
  dragging.value = true;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!dragStart || dragStart.pointer !== event.pointerId) return;
  if (Math.hypot(event.clientX - dragStart.pointerX, event.clientY - dragStart.pointerY) > 6) dragStart.moved = true;
  position.value = {
    x: dragStart.x + event.clientX - dragStart.pointerX,
    y: dragStart.y + event.clientY - dragStart.pointerY,
  };
  keepInView();
}

function endDrag() {
  if (!dragStart) return;
  suppressBubbleClick = dragStart.moved;
  dragging.value = false;
  dragStart = null;
  activity();
}

function openBubble(event) {
  if (suppressBubbleClick && event.detail !== 0) { suppressBubbleClick = false; return; }
  suppressBubbleClick = false;
  toggleExpanded();
}

function setMode(next) {
  rolling.value = next === 'bubble' || (mode.value === 'expanded' && next === 'bar');
  mode.value = next;
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
  setMode(typeof force === 'boolean' ? (force ? 'expanded' : 'bar') : nextPlayerMode(mode.value));
  activity();
  await nextTick();
  keepInView();
  if (expanded.value && !selected.value) searchInput.value?.focus({ preventScroll: true });
  else if (!expanded.value) expandButton.value?.focus({ preventScroll: true });
}

function activity() {
  window.clearTimeout(idleTimer);
  if (mode.value === 'bubble') return;
  idleTimer = window.setTimeout(async () => {
    if (dragging.value) { activity(); return; }
    const restoreFocus = card.value?.contains(document.activeElement);
    if (disposed) return;
    setMode('bubble');
    await nextTick();
    keepInView();
    if (restoreFocus) bubbleButton.value?.focus({ preventScroll: true });
  }, PLAYER_IDLE_MS);
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
  if (!audio.value) return;
  if (!selected.value) return toggleExpanded(true);
  if (!audio.value.paused) return stopLocalAudio();
  const attempt = ++playAttempt;
  busy.value = true;
  notice.value = '';
  try {
    if (audio.value.error) audio.value.load();
    await audio.value.play();
  } catch (error) {
    if (attempt !== playAttempt) return;
    playing.value = false;
    busy.value = false;
    notice.value = error.name === 'NotAllowedError'
      ? 'Tap play again to let your browser start the music.'
      : error.message || 'This track could not play. Please choose another result.';
  }
}

async function selectLocal(track, startPlaying = false) {
  stopLocalAudio();
  if (track.source !== 'audius') queue.value = [...library.value];
  selected.value = track;
  elapsed.value = 0;
  duration.value = 0;
  notice.value = startPlaying ? '' : 'Ready when you are. Tap the line to play.';
  await nextTick();
  if (!audio.value) return;
  audio.value.volume = Number(volume.value);
  audio.value.load();
  keepInView();
  if (startPlaying) await togglePlayback();
}

function playQueueItem(track) { return selectLocal({ ...track, url: track.source === 'audius' ? streamUrl(track.id) : track.url }, true); }
function skipTrack(direction) {
  const index = queueIndex.value + direction;
  if (index >= 0 && index < queue.value.length) playQueueItem(queue.value[index]);
}
function ended() { playing.value = false; busy.value = false; if (queueIndex.value + 1 < queue.value.length) skipTrack(1); }

function chooseFiles(event) {
  const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i.test(file.name));
  if (!files.length) {
    notice.value = 'Choose an audio file such as MP3, M4A or WAV.';
    return;
  }
  const tracks = files.map(file => ({ title: file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) }));
  library.value.push(...tracks);
  queue.value = [...library.value];
  query.value = '';
  selectLocal(tracks[0]);
  event.target.value = '';
}

async function searchCatalog(more = false) {
  if (!query.value.trim()) return;
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
    if (!results.value.length) notice.value = 'No freely playable matches on Audius. Try another song or artist.';
  } catch (error) {
    if (requestController === controller) notice.value = controller.signal.reason === 'timeout' ? 'Search took too long. Please try again.' : error.name === 'AbortError' ? '' : error.message;
  } finally {
    window.clearTimeout(timeout);
    if (requestController === controller) searching.value = false;
  }
}

function selectCatalogTrack(track) {
  if (selected.value?.id === track.id) { togglePlayback(); return; }
  queue.value = [...results.value];
  playQueueItem(track);
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
  disposed = true;
  window.clearTimeout(idleTimer);
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
  <aside ref="card" class="music-card glass-panel" :class="{ 'is-expanded': expanded, 'is-bubble': mode === 'bubble', 'is-dragging': dragging, 'is-playing': playing, 'is-rolling': rolling }" :style="cardStyle" aria-label="Music player" @keydown.esc="toggleExpanded(false)" @pointermove.passive="activity" @pointerdown="activity" @keydown="activity" @input="activity" @focusin="activity" @wheel.passive="activity">
    <button v-if="mode === 'bubble'" ref="bubbleButton" class="bubble-button" type="button" aria-label="Show music controls" title="Click to open · drag to move · arrow keys to position" @click="openBubble" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" @keydown="moveWithKeyboard"><span class="bubble-cross" aria-hidden="true" @animationend="rolling = false">×</span></button>
    <div v-else class="music-toolbar">
      <button class="wave-button" type="button" :aria-label="playLabel" :aria-pressed="selected ? playing : undefined" :aria-busy="busy" @click="togglePlayback">
        <svg viewBox="0 0 60 24" width="60" height="24" aria-hidden="true"><path :d="wave" /></svg>
      </button>
      <button class="drag-handle" type="button" aria-label="Move music player. Drag or use arrow keys; Home resets position." title="Drag to move · arrow keys also work" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" @keydown="moveWithKeyboard">
        <span class="player-label">{{ expanded ? 'SOUNDTRACK' : 'MUSIC' }}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true"><circle v-for="n in 6" :key="n" :cx="n % 2 ? 4 : 8" :cy="Math.ceil(n / 2) * 4 - 2" r="1" /></svg>
      </button>
      <button ref="expandButton" class="icon-button expand-button" type="button" :aria-label="expanded ? 'Minimize music player' : 'Choose music'" :aria-expanded="expanded" aria-controls="music-panel" @click="toggleExpanded()">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" @animationend="rolling = false"><path :d="expanded ? 'M5 10h10' : 'M10 5v10M5 10h10'" /></svg>
      </button>
    </div>

    <div v-show="expanded" id="music-panel" class="music-panel" @wheel.stop @touchmove.stop>
      <div class="now-heading">
        <img v-if="selected?.artwork" :src="selected.artwork" alt="" class="now-artwork" />
        <div v-else class="now-placeholder" aria-hidden="true">♪</div>
        <div class="now-copy"><p class="now-eyebrow">{{ selected ? (busy ? 'BUFFERING' : playing ? 'NOW PLAYING' : 'READY TO PLAY') : 'YOUR LITTLE LISTENING ROOM' }}</p><div class="track-heading"><p>{{ currentTitle }}</p></div><p class="music-caption">{{ selected?.artist || 'Find a song. Stay a while.' }}</p></div>
      </div>
      <section v-if="selected" class="local-controls" aria-label="Playback controls">
        <input class="seek-control" type="range" aria-label="Playback position" min="0" :max="duration || 1" step="0.1" :value="elapsed" :disabled="!duration" @input="audio && (audio.currentTime = Number($event.target.value))" />
        <div class="progress-labels"><span>{{ timeLabel(elapsed) }}</span><span>{{ timeLabel(duration) }}</span></div>
        <div class="transport-controls"><button type="button" aria-label="Previous track" :disabled="queueIndex <= 0" @click="skipTrack(-1)"><span aria-hidden="true">⏮</span></button><button type="button" class="play-control" :aria-label="playLabel" :aria-busy="busy" @click="togglePlayback"><span v-if="busy" class="loading-ring" aria-hidden="true"></span><span v-else aria-hidden="true">{{ playing ? 'Ⅱ' : '▶' }}</span></button><button type="button" aria-label="Next track" :disabled="queueIndex < 0 || queueIndex >= queue.length - 1" @click="skipTrack(1)"><span aria-hidden="true">⏭</span></button></div>
        <div class="volume-controls"><span>Volume</span><input v-model="volume" aria-label="Music volume" type="range" min="0" max="1" step="0.01" /><span class="volume-value">{{ Math.round(volume * 100) }}%</span></div>
        <div class="queue-caption"><span>{{ queueIndex >= 0 ? `${queueIndex + 1} of ${queue.length} in queue` : 'From your device' }}</span><button class="text-button" type="button" @click="clearMusic">Clear</button></div>
      </section>
      <form class="music-search" role="search" @submit.prevent="searchCatalog()">
        <label class="sr-only" for="music-search-input">Search songs and artists on Audius</label>
        <input ref="searchInput" id="music-search-input" v-model="query" type="search" placeholder="Search songs or artists…" autocomplete="off" maxlength="150" />
        <button class="search-action" type="submit" :disabled="searching || !query.trim()">{{ searching ? '…' : 'Search' }}</button>
      </form>
      <p class="music-hint">Search Audius · tap a result to play here. Catalog availability varies.</p>
      <p v-if="notice" class="music-notice" role="status">{{ notice }}</p>
      <p class="sr-only" role="status">{{ searching ? 'Searching music' : results.length ? `${results.length} playable results` : '' }}</p>
      <div v-if="results.length" class="results-heading"><span>SEARCH RESULTS</span><span>{{ results.length }} songs</span></div>
      <ul v-if="results.length" class="music-results" aria-label="Music search results" :aria-busy="searching">
        <li v-for="track in results" :key="track.id"><button class="catalog-result" type="button" :aria-label="`${selected?.id === track.id && playing ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`" :aria-pressed="selected?.id === track.id" @click="selectCatalogTrack(track)">
          <img v-if="track.artwork" :src="track.artwork" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer" />
          <span v-else class="artwork-placeholder" aria-hidden="true">♪</span>
          <span class="result-copy"><span>{{ track.title }}</span><small>{{ track.artist }}</small></span>
          <span class="result-play" aria-hidden="true">{{ selected?.id === track.id && playing ? 'Ⅱ' : '▶' }}</span>
        </button></li>
      </ul>
      <button v-if="hasMore" class="more-results" type="button" :disabled="searching" @click="searchCatalog(true)">{{ searching ? 'Loading…' : 'Show more results' }}</button>

      <ul v-if="filteredLibrary.length" class="music-results local-library" aria-label="Your music files">
        <li v-for="track in filteredLibrary" :key="track.url"><button type="button" :aria-pressed="selected?.url === track.url" @click="selectLocal(track)"><span>{{ track.title }}</span><small>{{ selected?.url === track.url ? 'Selected' : 'From your device' }}</small></button></li>
      </ul>
      <div class="music-footer"><button class="text-button" type="button" @click="filePicker.click()">Choose from device</button><a href="https://audius.co" target="_blank" rel="noopener noreferrer">Powered by Audius ↗</a></div>
      <input ref="filePicker" class="sr-only" type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus" multiple tabindex="-1" aria-label="Choose local music files" @change="chooseFiles" />
    </div>

    <audio ref="audio" :src="selected?.url" preload="none" @playing="playing = true; busy = false" @pause="playing = false; busy = false" @waiting="playing = false; busy = true" @ended="ended" @timeupdate="elapsed = $event.currentTarget.currentTime" @loadedmetadata="duration = Number.isFinite($event.currentTarget.duration) ? $event.currentTarget.duration : 0" @error="playing = false; busy = false; notice = selected ? 'This track is unavailable. Please choose another result or a device file.' : ''" />
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
  transition: width .42s cubic-bezier(.22,1,.36,1), border-radius .42s, background .3s, box-shadow .3s;
}
.music-card.is-expanded { width: 370px; border-radius: 28px; --glass-tint: rgb(16 29 29 / 83%); border-color: #d3f5e54d; }
.music-card.is-bubble { width: 54px; height: 54px; border-radius: 50%; }
.music-card.is-bubble.is-playing { --glass-tint: #059669; --glass-solid: #047857; background: linear-gradient(145deg,#6ee7b799,#10b98118 50%), #047857; border-color: #a7f3d099; box-shadow: inset 0 1px 2px #ffffffb0, inset 0 -2px 5px #004d3940, 0 8px 26px #04785740; }
.bubble-button { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; font-size: 29px; font-weight: 200; line-height: 1; touch-action: none; cursor: grab !important; user-select: none; }
.is-dragging .bubble-button { cursor: grabbing !important; }
.bubble-cross { display: block; }
.is-rolling .bubble-cross { animation: roll-closed .6s cubic-bezier(.22,1,.36,1) both; }
.is-rolling .expand-button svg { animation: roll-symbol .45s cubic-bezier(.22,1,.36,1); }
@keyframes roll-closed { from { transform: translateX(50px) rotate(300deg); opacity: .1; } to { transform: translateX(0) rotate(0); opacity: 1; } }
@keyframes roll-symbol { from { transform: rotate(180deg); } to { transform: rotate(0); } }
.bubble-button:hover { background: #ffffff20; }
.music-card.is-dragging { user-select: none; box-shadow: 0 18px 50px rgb(0 0 0 / 32%); }
.music-toolbar { display: flex; align-items: center; gap: 2px; padding: 5px; }
.music-card button, .music-card a, .music-card input { -webkit-tap-highlight-color: transparent; }
.music-card button, .music-card a { color: inherit; }
.music-card button { cursor: pointer; }
.music-card button:focus-visible, .music-card a:focus-visible, .music-card input:focus-visible { outline: 2px solid #6ee7b7; outline-offset: -2px; }
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
.music-panel { padding: 10px 18px 17px; overflow-y: auto; max-height: min(680px, calc(100dvh - 90px)); overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #ffffff35 transparent; }
.now-heading { display: flex; align-items: center; gap: 14px; padding: 4px 0 14px; }
.now-copy { min-width: 0; flex: 1; }
.now-eyebrow { color: #91cbb3; font-size: 8px; font-weight: 600; letter-spacing: .13em; margin-bottom: 5px; }
.now-placeholder { display: grid; place-items: center; width: 64px; height: 64px; flex: 0 0 64px; border-radius: 16px; color: #c8f7e1; font-size: 28px; background: linear-gradient(140deg,#72c7a838,#6ee7b709); border: 1px solid #9be3c72b; }
.track-heading { display: flex; align-items: center; gap: 12px; }
.track-heading p { min-width: 0; flex: 1; font-size: 17px; font-weight: 600; line-height: 1.35; text-wrap: pretty; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
.music-caption { color: #b2c4bc; font-size: 12px; margin: 4px 0 0; overflow-wrap: anywhere; }
.music-search { margin-top: 15px; display: flex; align-items: center; gap: 4px; background: rgb(255 255 255 / 8%); border: 1px solid rgb(255 255 255 / 15%); border-radius: 13px; padding: 3px 4px 3px 12px; }
.music-search input { color: inherit; min-width: 0; width: 100%; background: transparent; border: 0; height: 38px; font: inherit; }
.music-search input::placeholder { color: #c3bcb7; font-size: 12px; }
.search-action { flex-shrink: 0; display: grid; place-items: center; min-width: 50px; min-height: 36px; padding: 0 10px; font-size: 11px; border-radius: 10px; background: #8cdbb926; color: #d6fbea !important; text-decoration: none; }
.search-action:disabled { opacity: .4; }
.music-hint { font-size: 11px; line-height: 1.55; color: #c8c1bd; margin: 8px 0 0; }
.music-hint a { text-decoration: underline; text-underline-offset: 3px; }
.music-notice { font-size: 12px; color: #eed0b3; margin: 11px 0; }
.music-results { list-style: none; padding: 0; margin: 12px 0; max-height: min(260px, 32dvh); overflow-y: auto; overscroll-behavior: contain; }
.music-results button { text-align: left; width: 100%; padding: 9px 10px; border-radius: 10px; }
.music-results button:hover { background: rgb(255 255 255 / 7%); }
.music-results button[aria-pressed='true'] { background: #34d39918; box-shadow: inset 2px 0 #6ee7b7; }
.music-results span, .music-results small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.music-results small { color: #bfb6b1; font-size: 10px; margin-top: 1px; }
.catalog-result { display: flex; align-items: center; gap: 10px; }
.catalog-result img, .artwork-placeholder { width: 40px; height: 40px; border-radius: 9px; object-fit: cover; flex-shrink: 0; background: #ffffff18; }
.artwork-placeholder { text-align: center; padding-top: 9px; }
.result-copy { min-width: 0; flex: 1; }
.result-play { display: grid !important; place-items: center; width: 27px; height: 27px; flex: 0 0 27px; border-radius: 50%; font-size: 10px; background: #ffffff0c; color: #c7ecd9; }
.results-heading { display: flex; justify-content: space-between; margin-top: 20px; font: 9px/1.5 -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: .12em; color: #a5bcb1; }
.more-results, .play-control { padding: 7px 12px; border: 1px solid #ffffff35; border-radius: 999px; background: linear-gradient(160deg, #ffffff26, #ffffff08); font-size: 11px; }
.connection-notice { margin-top: 16px; padding: 14px; border: 1px solid #ffffff30; border-radius: 16px; background: #ffffff09; font-size: 12px; }
.connection-notice strong { font-weight: 500; }
.connection-notice p { opacity: .75; margin-top: 5px; line-height: 1.6; }
.transport-controls { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 12px 0 16px; }
.transport-controls button { min-width: 44px; min-height: 44px; border-radius: 50%; font-size: 19px; }
.transport-controls button:hover:not(:disabled) { background: #ffffff18; }
.transport-controls button:disabled { opacity: .3; cursor: default; }
.now-artwork { width: 64px; height: 64px; flex: 0 0 64px; border-radius: 16px; object-fit: cover; box-shadow: 0 5px 16px #0004; }
.more-results { display: block; margin: 0 auto; }
.more-results:disabled { opacity: .5; }
.now-playing { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; font-size: 10px; }
.transport-controls .play-control { min-width: 54px; min-height: 54px; padding: 0; display: grid; place-items: center; background: #a7f3d0; color: #064e3b !important; border: 1px solid #d1fae5; box-shadow: 0 3px 16px #10b98125; font-size: 20px; }
.transport-controls .play-control:hover { background: #d1fae5; }
.loading-ring { width: 20px; height: 20px; border: 2px solid #064e3b40; border-top-color: #064e3b; border-radius: 50%; animation: music-loading .8s linear infinite; }
@keyframes music-loading { to { rotate: 360deg; } }
.local-controls { padding: 0 3px 14px; border-bottom: 1px solid #ffffff12; }
.queue-caption { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9bb3a7; margin-top: 10px; }
.progress-labels { display: flex; justify-content: space-between; color: #c5bcb6; font-size: 10px; font-variant-numeric: tabular-nums; }
.seek-control { width: 100%; accent-color: #6ee7b7; height: 20px; cursor: pointer; }
.volume-controls { display: flex; align-items: center; gap: 14px; margin-top: 5px; font-size: 11px; color: #c5bcb6; }
.volume-controls input { flex: 1; width: 100%; min-width: 0; height: 24px; accent-color: #6ee7b7; cursor: pointer; }
.volume-value { min-width: 30px; text-align: right; font-size: 10px; font-variant-numeric: tabular-nums; }
.music-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-top: 16px; padding-top: 13px; border-top: 1px solid rgb(255 255 255 / 12%); font-size: 10px; color: #d7cbc1; }
.music-footer a { text-decoration: none; }
.music-footer a:hover, .text-button:hover { text-decoration: underline; text-underline-offset: 3px; }
.text-button { font: inherit; flex-shrink: 0; }
.track-heading .text-button { color: #c5bcb6; font-size: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 600px) { .music-card { right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); } }
@media (prefers-reduced-motion: reduce) { .music-card { transition: none; } .bubble-cross, .expand-button svg, .loading-ring { animation: none !important; } }
@media (prefers-reduced-transparency: reduce) { .music-card { background: #262329; backdrop-filter: none; -webkit-backdrop-filter: none; } }
</style>
