<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { AnimatedComponent } from '@/services/AnimatedComponent'
import { useCursorContext } from '@/composables/useCursorContext';
import { useWindowContext } from '@/composables/useWindowContext';

const { getPositions } = useCursorContext();
const { md } = useWindowContext();


const rootRef = ref();
const component = ref();
const parallaxItems = ref([]);
const autoAnimDegree = ref(0);

const updatePosition = () => {

  const rootRect = rootRef.value.getBoundingClientRect();
  let cur = getPositions();
  let relativeCursorX = rootRect.width / 2 + rootRect.left
  let relativeCursorY = rootRect.height / 2 + rootRect.top

  if (!md.value) {
    autoAnimDegree.value = (autoAnimDegree.value + 0.005) % 360;
    const hyp = 300;

    cur.x = hyp * Math.cos(autoAnimDegree.value * 1.5)
    cur.y = hyp * Math.sin(autoAnimDegree.value)
    relativeCursorX = 0
    relativeCursorY = 0
  };

  parallaxItems.value.forEach(el => {
    const multiplicator = el.dataset.parallaxValue;
    let x;
    let y;

    if (!md.value) {
      // Linear move
      x = (cur.x - relativeCursorX) * -multiplicator;
      y = (cur.y - relativeCursorY) * -multiplicator;
     
    } else {
       // Quadratic move
      const dx = cur.x - relativeCursorX;
      const dy = cur.y - relativeCursorY;
      x = -(dx * multiplicator * 2) / Math.log(Math.abs(dx) + 2);
      y = -(dy * multiplicator * 2) / Math.log(Math.abs(dy) + 2);
    }

    el.style.transform = `translateX(${x}px) translateY(${y}px)`;
  })
}

onMounted(() => {
  parallaxItems.value = Array.from(rootRef.value.getElementsByClassName("parallax"));
  component.value = new AnimatedComponent(rootRef.value);
  component.value.tick = updatePosition;
  component.value.autoAnimate();
})

onBeforeUnmount(() => {
  component.value.reset();
})
</script>

<template>
  <div ref="rootRef" class="parallax-wrapper h-full w-full">
    <slot></slot>
  </div>
</template>
