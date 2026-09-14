<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { AnimatedComponent } from '@/services/AnimatedComponent';

const rootRef = ref(null);
let component;
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
}
function reset() { pointer = { x: 0, y: 0 }; }
function release(event) { if (event.pointerType !== 'mouse') reset(); }
function update() {
  const bounds = rootRef.value.getBoundingClientRect();
  const target = motion?.matches ? { x: 0, y: 0 } : pointer;
  current.x += (target.x - current.x) * .12;
  current.y += (target.y - current.y) * .12;
  const dx = current.x * Math.min(bounds.width, 1200) / 2;
  const dy = current.y * Math.min(bounds.height, 900) / 2;
  items.forEach(el => {
    const depth = Number(el.dataset.parallaxValue) || 0;
    const x = -(dx * depth * 2) / Math.log(Math.abs(dx) + 2);
    const y = el.dataset.parallaxAxis === 'x' ? 0 : -(dy * depth * 2) / Math.log(Math.abs(dy) + 2);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}
onMounted(() => {
  items = [...rootRef.value.querySelectorAll('.parallax')];
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', reset);
  component = new AnimatedComponent(rootRef.value);
  component.tick = update;
  component.autoAnimate();
});
onBeforeUnmount(() => { component?.reset(); motion?.removeEventListener('change', reset); });
</script>

<template>
  <div ref="rootRef" class="parallax-wrapper h-full w-full" @pointermove="move" @pointerleave="reset" @pointercancel="reset" @pointerup="release">
    <slot></slot>
  </div>
</template>
