<script setup>
import { computed } from 'vue';
const props = defineProps({ project: Object, placement: Object, shine: Object });
defineEmits(['open', 'enter', 'leave', 'move', 'dismiss']);
const style = computed(() => ({
  left: `${props.placement.x}px`, top: `${props.placement.y}px`,
  '--shine-x': `${props.shine.x}%`, '--shine-y': `${props.shine.y}%`,
  '--tilt-x': `${(props.shine.y - 50) / -9}deg`, '--tilt-y': `${(props.shine.x - 50) / 9}deg`,
}));
</script>

<template>
  <Teleport to="body">
    <button class="project-popup" :style="style" type="button" :aria-label="`Show ${project.title} project details`" @click="$emit('open')" @pointerenter="$emit('enter')" @pointermove="$emit('move', $event)" @pointerleave="$emit('leave')" @focus="$emit('enter')" @blur="$emit('leave')" @keydown.esc="$emit('dismiss')">
      <span class="popup-face">
        <span class="popup-edition">SELECTED WORK <span>✦</span></span>
        <img :src="project.desktop_pic" :alt="`${project.title} preview`" decoding="async" />
        <span class="popup-title">{{ project.title }}</span>
        <span class="popup-hint">Click to explore <span>↗</span></span>
        <span class="popup-foil" aria-hidden="true"></span>
        <span class="popup-glare" aria-hidden="true"></span>
      </span>
    </button>
  </Teleport>
</template>

<style scoped>
.project-popup { position: fixed; z-index: 65; width: 286px; max-width: calc(100vw - 32px); padding: 0; border: 0; background: none; cursor: pointer; text-align: left; perspective: 900px; animation: card-arrive .18s ease-out; }
.popup-face { position: relative; display: flex; flex-direction: column; padding: 12px; overflow: hidden; isolation: isolate; border: 1px solid #ffffffb0; border-radius: 20px; background: linear-gradient(140deg, #cad9e9, #889cae 25%, #f6e7d9 55%, #afc7c1); box-shadow: 0 18px 48px #0006, inset 0 1px 2px #fff; color: #17242c; transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y)); transition: transform .12s ease-out; }
.popup-edition, .popup-hint { display: flex; justify-content: space-between; font: 10px/1.5 -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: .12em; padding: 0 3px 9px; }
.popup-face img { display: block; width: 100%; height: 165px; object-fit: contain; border-radius: 10px; background: #142027; }
.popup-title { font: 600 20px/1.4 -apple-system, BlinkMacSystemFont, sans-serif; padding: 12px 3px 4px; }
.popup-hint { letter-spacing: .04em; padding-bottom: 2px; }
.popup-foil, .popup-glare { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; }
.popup-foil { background: repeating-linear-gradient(115deg,#ff8baf 0%,#ffe49b 12%,#b9f2b6 24%,#92def6 36%,#c6b0ff 48%,#ff8baf 60%); background-size: 240% 240%; background-position: var(--shine-x) var(--shine-y); mix-blend-mode: color-dodge; opacity: .36; mask-image: radial-gradient(ellipse at var(--shine-x) var(--shine-y),#000,transparent 80%); }
.popup-glare { background: radial-gradient(ellipse at var(--shine-x) var(--shine-y),#ffffff95,transparent 62%); mix-blend-mode: screen; opacity: .55; }
.project-popup:focus-visible { outline: 3px solid #63bfe5; outline-offset: 6px; border-radius: 20px; }
@keyframes card-arrive { from { opacity: 0; translate: 0 10px; } to { opacity: 1; translate: 0 0; } }
@media (hover: none), (max-width: 767px) { .project-popup { display: none; } }
@media (prefers-reduced-motion: reduce) { .project-popup { animation: none; } .popup-face { transform: none; transition: none; } }
</style>
