<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const rootRef = ref(null);
let frame = 0;
let previousTime = 0;
let disposed = false;
let items = [];
let motion;
let pointer = { x: 0, y: 0 };
let current = { x: 0, y: 0 };

function move(event) {
  if (motion?.matches) return;
  const bounds = rootRef.value.getBoundingClientRect();
  pointer = {
    x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)),
    y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)),
  };
  schedule();
}
function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(update); }
function reset() { pointer = { x: 0, y: 0 }; schedule(); }
function release(event) { if (event.pointerType !== 'mouse') reset(); }
function update(time) {
  frame = 0;
  const bounds = rootRef.value.getBoundingClientRect();
  const target = motion?.matches ? { x: 0, y: 0 } : pointer;
  const delta = previousTime ? Math.min(50, time - previousTime) : 16.67;
  previousTime = time;
  const ease = motion?.matches ? 1 : 1 - Math.exp(-delta / 95);
  current.x += (target.x - current.x) * ease;
  current.y += (target.y - current.y) * ease;
  const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < .001;
  if (settled) current = { ...target };
  const dx = current.x * Math.min(bounds.width, 1200) / 2;
  const dy = current.y * Math.min(bounds.height, 900) / 2;
  items.forEach(el => {
    const depth = Number(el.dataset.parallaxValue) || 0;
    const x = -(dx * depth * 2) / Math.log(Math.abs(dx) + 2);
    const y = el.dataset.parallaxAxis === 'x' ? 0 : -(dy * depth * 2) / Math.log(Math.abs(dy) + 2);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  if (!settled) schedule();
  else previousTime = 0;
}
onMounted(() => {
  items = [...rootRef.value.querySelectorAll('.parallax')];
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', reset);
  window.addEventListener('resize', schedule, { passive: true });
});
onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(frame);
  motion?.removeEventListener('change', reset);
  window.removeEventListener('resize', schedule);
});
</script>

<template>
  <div ref="rootRef" class="parallax-wrapper h-full w-full" @pointermove="move" @pointerleave="reset" @pointercancel="reset" @pointerup="release">
    <slot></slot>
  </div>
</template>
