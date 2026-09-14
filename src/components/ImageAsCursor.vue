<script setup>
import { ref, onMounted, defineProps, onBeforeUnmount } from 'vue'
import { useImageAsCursor } from '@/composables/useImageAsCursor'
import { AnimatedComponent } from '@/services/AnimatedComponent'
import { useCursorContext } from '@/composables/useCursorContext'
import { useScrollContext } from '@/composables/useScrollContext'
import ExternalLinkIcon from '@/icons/ExternalLinkIcon.vue'

const props = defineProps({
    contentSection: {
        type: HTMLElement,
        required: true
    }
})

const { containerRef } = useScrollContext();
const { getPositions } = useCursorContext();
const { imageUrl, isOpen, isUrl, isSmall } = useImageAsCursor();
const component = ref();
const loopComponent = ref();
const x = ref(window.innerWidth / 2);
const y = ref(window.innerHeight / 2);
const imagePositions = ref({x: x.value, y: y.value});

const updatePosition = () => {
  const cur = getPositions();
  imagePositions.value.x = cur.x;
  imagePositions.value.y = cur.y;
}

const shouldMove = (position, targetPosition) => {
  return Math.round(position.value * 100) / 100 != targetPosition;
}

const animatePos = (currentPos, newPos) => {
  if (!shouldMove(currentPos.value, newPos)) return;
  currentPos.value += (newPos - currentPos.value) * .08;
}

const animate = () => {
  animatePos(x, imagePositions.value.x);
  animatePos(y, imagePositions.value.y);
}

onMounted(() => {
  component.value = new AnimatedComponent(props.contentSection);
  component.value.tick = updatePosition;
  component.value.addAnimationTrigger(window, "mousemove");
  component.value.addAnimationTrigger(containerRef.value, "scroll");

  loopComponent.value = new AnimatedComponent(props.contentSection);
  loopComponent.value.tick = animate;
  loopComponent.value.autoAnimate();
})

onBeforeUnmount(() => {
    component.value.reset();
    loopComponent.value.reset();
})
</script>

<template>
  <div
    class="aspect-video absolute hidden md:flex shadow-[#0003] shadow-lg z-40 -translate-1/2 pointer-events-none rounded-[4dvw] overflow-hidden ease-linear transition-all duration-75"
    :class="isOpen ? (isSmall ? 'w-[20dvh]' : 'w-[30dvh]') : 'w-0'" :style="`left: ${x}px; top: ${y}px`">
    <div class="relative w-full h-full">
      <div :class="`${isUrl ? 'opacity-60' : 'opacity-0'}`" class="absolute h-full w-full transition-all inset-0 bg-black flex justify-center items-center">
        <ExternalLinkIcon class="h-1/2 w-1/2 text-white"/>
      </div>
      <img :src="imageUrl" alt="" class="w-full h-full object-cover" />
    </div>
  </div>
</template>
