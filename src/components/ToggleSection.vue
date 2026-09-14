<script setup>
import { ref, useId, onBeforeUnmount } from 'vue';
import ArrowIcon from '@/icons/ArrowIcon.vue';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['toggle', 'hover', 'leave']);
const panelId = useId();
const rowRef = ref(null);
let frame = 0;
let position = { x: 50, y: 50 };
const followPointer = (event) => {
  const bounds = rowRef.value.getBoundingClientRect();
  position = {
    x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
    y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100))
  };
  rowRef.value.dataset.interacting = 'true';
  if (!frame) frame = requestAnimationFrame(() => {
    frame = 0;
    rowRef.value?.style.setProperty('--pointer-x', `${position.x}%`);
    rowRef.value?.style.setProperty('--pointer-y', `${position.y}%`);
  });
};
const reset = () => {
  cancelAnimationFrame(frame);
  frame = 0;
  if (rowRef.value) rowRef.value.dataset.interacting = 'false';
  emit('leave');
};
const touchEnd = (event) => { if (event.pointerType !== 'mouse') reset(); };
onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <div class="project-accordion flex-1 flex flex-col w-full">
    <button ref="rowRef" type="button" class="project-row font-rubik text-xl lg:text-[2dvw]"
      :class="{ 'is-open': props.open }" :aria-expanded="props.open" :aria-controls="panelId"
      @click="emit('toggle')" @pointerenter="emit('hover')" @pointermove="followPointer"
      @pointerdown="followPointer" @pointerleave="reset" @pointercancel="reset" @pointerup="touchEnd">
      <span class="project-row-content">
        <slot name="header"></slot>
        <span class="project-arrow"><ArrowIcon :class="{ 'rotate-90': props.open }" /></span>
      </span>
      <span class="project-foil" aria-hidden="true"></span>
      <span class="project-glare" aria-hidden="true"></span>
    </button>
    <div :id="panelId" :hidden="!props.open" class="project-details">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style scoped>
.project-accordion { min-height: 116px; }
.project-row { --pointer-x: 50%; --pointer-y: 50%; position: relative; flex: 1; width: 100%; min-height: 116px; padding: 24px; isolation: isolate; overflow: hidden; cursor: pointer; color: white; text-align: left; touch-action: pan-y; border-top: 1px solid #ffffff45; background: #101417; }
.project-row-content { display: flex; width: 100%; height: 100%; align-items: center; justify-content: space-between; gap: 20px; position: relative; z-index: 2; }
.project-row :deep(.project-background) { position: absolute; inset: -24px; width: calc(100% + 48px); max-width: none; height: calc(100% + 48px); object-fit: cover; z-index: -2; opacity: .64; transition: opacity .3s; }
.project-row:is(:hover, :focus-visible, .is-open) :deep(.project-background) { opacity: .42; }
.project-arrow { flex: 0 0 26px; }
.project-arrow svg { width: 26px; height: 26px; transition: transform .3s; }
.project-foil, .project-glare { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .35s; z-index: 1; }
.project-foil {
  /* Original gradient composition inspired by Simey’s holographic card demo. */
  background: repeating-linear-gradient(115deg, #ff91b5 0%, #ffd996 12%, #b7f5ac 24%, #99e4f9 36%, #c0b3ff 48%, #ff91b5 60%);
  background-size: 250% 250%; background-position: var(--pointer-x) var(--pointer-y);
  mix-blend-mode: color-dodge;
  mask-image: radial-gradient(ellipse at var(--pointer-x) var(--pointer-y), #000 0%, #0008 40%, transparent 78%);
}
.project-glare { background: radial-gradient(ellipse at var(--pointer-x) var(--pointer-y), #ffffff66, #ffffff08 40%, transparent 68%); mix-blend-mode: screen; }
.project-row:is([data-interacting="true"], :focus-visible) .project-foil { opacity: .58; }
.project-row:is([data-interacting="true"], :focus-visible) .project-glare { opacity: .62; }
.project-details { background: #111619; color: #fff; }
.project-details[hidden] { display: none; }
@media (max-width: 767px) { .project-row { padding: 22px 18px; min-height: 110px; } .project-row-content { gap: 12px; } }
@media (prefers-reduced-motion: reduce) { .project-foil, .project-glare, .project-arrow svg, .project-row :deep(.project-background) { transition: none; } .project-foil { background-position: center; } }
</style>
