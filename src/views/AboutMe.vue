<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import stories from '@/data/about-me.json';
import { useScrollContext } from '@/composables/useScrollContext';

const { containerRef } = useScrollContext();
const track = ref(null);
const scene = ref(null);
const storyWindow = ref(null);
const bodies = ref([]);
const active = ref(0);
const progress = ref(0);
const pan = ref(0);
let segments = [];
let observer;
let frame = 0;
let scroller;
let disposed = false;

function update() {
  frame = 0;
  if (!segments.length || disposed) return;
  const top = parseFloat(getComputedStyle(scene.value).top) || 0;
  const distance = Math.max(0, top - track.value.getBoundingClientRect().top);
  let start = 0;
  let index = 0;
  while (index < segments.length - 1 && distance >= start + segments[index].length) start += segments[index++].length;
  const segment = segments[index];
  active.value = index;
  progress.value = Math.min(1, (distance - start) / segment.length);
  // Long phone stories read vertically with the page scroll, before the next slide.
  pan.value = Math.min(segment.overflow, Math.max(0, distance - start - segment.hold * .35));
}
function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(update); }
function measure() {
  if (disposed || !scene.value || !storyWindow.value) return;
  const viewport = scroller?.clientHeight || window.innerHeight;
  const hold = Math.max(340, viewport * .7);
  segments = bodies.value.map(body => {
    const overflow = Math.max(0, body.scrollHeight - storyWindow.value.clientHeight);
    return { overflow, hold, length: hold + overflow };
  });
  track.value.style.height = `${scene.value.offsetHeight + segments.reduce((sum, s) => sum + s.length, 0)}px`;
  schedule();
}
onMounted(() => {
  scroller = containerRef.value;
  scroller?.addEventListener('scroll', schedule, { passive: true });
  observer = new ResizeObserver(measure);
  observer.observe(scene.value);
  bodies.value.forEach(body => observer.observe(body));
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  measure();
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  cancelAnimationFrame(frame);
  scroller?.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', measure);
});
</script>

<template>
  <FramedMainSection id="about-me" class="timeline-section">
    <div ref="track" class="timeline-track">
      <div ref="scene" class="timeline-scene">
        <img class="timeline-background" src="/optimized/backgrounds/room.webp" alt="" loading="lazy" />
        <div class="timeline-meta">
          <span>THE STORY / 0{{ active + 1 }}</span>
          <div class="timeline-dates"><span>{{ stories[active].from }}</span><div class="timeline-rail" aria-hidden="true"><span :style="{ scale: `${progress} 1` }"></span></div><span>{{ stories[active].to }}</span></div>
        </div>
        <div ref="storyWindow" class="story-window">
          <div class="story-pages" :style="{ transform: `translateY(${-active * 100}%)` }">
            <article v-for="(story, i) in stories" :key="story.when" class="story-page" :aria-hidden="i !== active" :inert="i !== active">
              <div :ref="el => bodies[i] = el" class="story-body" :style="{ transform: `translateY(${i === active ? -pan : 0}px)` }">
                <div class="timeline-copy">
                  <h2 class="font-rubik">{{ story.when }}</h2>
                  <p>{{ story.description }}</p>
                </div>
                <img :src="story.image" alt="" class="timeline-portrait" loading="lazy" @load="measure" />
              </div>
            </article>
          </div>
        </div>
        <div class="chapter-footer"><span>Scroll to follow the story</span><span>{{ active + 1 }} / {{ stories.length }} ↓</span></div>
      </div>
    </div>
  </FramedMainSection>
</template>

<style scoped>
.timeline-section { overflow: visible; }
.timeline-track { position: relative; }
.timeline-scene { position: sticky; top: 3dvw; height: calc(100svh - 6dvw); min-height: 320px; border-radius: 32px; overflow: hidden; isolation: isolate; color: white; display: flex; flex-direction: column; padding: clamp(88px, 11svh, 130px) clamp(24px, 5vw, 80px) 28px; }
.timeline-background { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: center bottom; }
.timeline-scene::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, #101512a8, #10151215); }
.timeline-meta { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; font: 11px/1.5 -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: .1em; }
.timeline-dates { display: flex; align-items: center; gap: 12px; }
.timeline-rail { width: clamp(60px, 12vw, 160px); height: 3px; background: #ffffff35; }
.timeline-rail span { display: block; height: 100%; background: #fff; transform-origin: left; }
.story-window { flex: 1; min-height: 0; overflow: hidden; }
.story-pages { height: 100%; transition: transform .4s cubic-bezier(.22,.65,.3,1); }
.story-page { height: 100%; overflow: hidden; }
.story-body { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 40px; min-height: 100%; padding: 18px 0; }
.timeline-copy h2 { font-size: clamp(17px, 2vw, 26px); line-height: 1.4; margin-bottom: 20px; }
.timeline-copy p { font-size: clamp(14px, 1.15vw, 17px); line-height: 1.8; }
.timeline-portrait { width: 100%; height: min(46svh, 460px); object-fit: contain; object-position: bottom; align-self: end; }
.chapter-footer { display: flex; justify-content: space-between; margin-top: 20px; font: 10px/1.5 -apple-system, BlinkMacSystemFont, sans-serif; opacity: .75; }
@media (max-width: 767px) {
  .timeline-scene { border-radius: 26px; padding: 84px 24px 20px; }
  .timeline-meta { font-size: 9px; gap: 8px; margin-bottom: 14px; }
  .timeline-dates { gap: 8px; }
  .story-body { grid-template-columns: 1fr; gap: 14px; padding: 8px 0 0; }
  .timeline-copy h2 { font-size: 16px; margin-bottom: 12px; }
  .timeline-copy p { font-size: 13px; line-height: 1.8; }
  .timeline-portrait { height: 130px; }
  .chapter-footer { font-size: 9px; margin-top: 12px; }
}
@media (prefers-reduced-motion: reduce) { .story-pages { transition: none; } }
</style>
