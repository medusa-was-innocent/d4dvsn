<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollContext } from '@/composables/useScrollContext'
import { AnimatedComponent } from '@/services/AnimatedComponent';

const { containerRef } = useScrollContext();
const frameRef = ref(null);
const component = ref(null);
const animPosition = ref();
const animTranslateY = ref();

const props = defineProps({
    contentSection: {
        type: HTMLElement,
        required: true
    }
})

const prepareAnimation = () => {
    if (!frameRef.value) return;

    const scrollPositionEnd = -props.contentSection.getBoundingClientRect().height + frameRef.value.offsetHeight;
    const scrollPositionCurrent = props.contentSection.getBoundingClientRect().top;
    animPosition.value = "absolute";
    animTranslateY.value = 0;

    if (scrollPositionCurrent <= 0 && scrollPositionCurrent >= scrollPositionEnd) {
        animPosition.value = "fixed";
    } else if (scrollPositionCurrent < scrollPositionEnd) {
        animTranslateY.value = scrollPositionEnd;
    }
}

const tick = () => {
    frameRef.value.style.transform = `translateY(${-animTranslateY.value}px)`;
    frameRef.value.style.position = animPosition.value;
}

onMounted(async () => {
    prepareAnimation();
    tick();
    component.value = new AnimatedComponent(frameRef.value);
    component.value.addAnimationTrigger(containerRef.value, "scroll");
    component.value.prepareForAnimations = prepareAnimation;
    component.value.tick = tick;
});

onBeforeUnmount(() => {
    component.value.reset();
})
</script>

<template>
    <div ref="frameRef" class="h-dvh w-dvw z-20 absolute top-0 left-0 pointer-events-none">
        <slot></slot>
    </div>
</template>
