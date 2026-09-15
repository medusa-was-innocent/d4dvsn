<script setup>
import { useId } from 'vue';
import ArrowIcon from '@/icons/ArrowIcon.vue';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['toggle', 'hover', 'leave', 'move']);
const panelId = useId();
const followPointer = (event) => emit('move', event);
const reset = () => emit('leave');
const touchEnd = (event) => { if (event.pointerType !== 'mouse') reset(); };
</script>

<template>
  <div class="project-accordion flex flex-col w-full">
    <button type="button" class="project-row font-rubik text-xl lg:text-[2dvw]"
      :class="{ 'is-open': props.open }" :aria-expanded="props.open" :aria-controls="panelId"
      @click="emit('toggle')" @pointerenter="emit('hover', $event)" @pointermove="followPointer" @focus="emit('hover', $event)" @blur="reset"
      @pointerdown="followPointer" @pointerleave="reset" @pointercancel="reset" @pointerup="touchEnd">
      <slot name="background"></slot>
      <span class="project-row-content">
        <slot name="header"></slot>
        <span class="project-arrow"><ArrowIcon :class="{ 'rotate-90': props.open }" /></span>
      </span>
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
.project-row :deep(.project-background) { position: absolute; inset: 0; width: 100%; max-width: none; height: 100%; object-fit: cover; z-index: -2; opacity: .64; transition: opacity .3s; }
.project-row:is(:hover, :focus-visible, .is-open) :deep(.project-background) { opacity: .42; }
.project-arrow { flex: 0 0 26px; }
.project-arrow svg { width: 26px; height: 26px; transition: transform .3s; }
.project-details { background: #111619; color: #fff; }
.project-details[hidden] { display: none; }
@media (max-width: 767px) { .project-row { padding: 22px 18px; min-height: 110px; } .project-row-content { gap: 12px; } }
@media (prefers-reduced-motion: reduce) { .project-arrow svg, .project-row :deep(.project-background) { transition: none; } }
</style>
