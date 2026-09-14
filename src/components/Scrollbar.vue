<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useScrollContext } from '@/composables/useScrollContext';

const thumbY = ref(0);
const isScollable = ref(false);
const coeff = ref(0);
const scrollTrack = ref();
const scrollThumb = ref();
const isDragging = ref(false);
const startY = ref(0);
const startThumbY = ref(0);

const { containerRef, contentRef } = useScrollContext();

const updateScrollbar = () => {
    if (!containerRef.value || !contentRef.value) return;

    isScollable.value = contentRef.value.clientHeight > containerRef.value.clientHeight;
    if (!isScollable.value) return;

    if (!scrollThumb.value || !scrollTrack.value) return;

    if (!isDragging.value) {
        const maxScrollScreen = contentRef.value.scrollHeight - containerRef.value.clientHeight;
        const maxScrollTrack = scrollTrack.value.clientHeight - scrollThumb.value.clientHeight;

        if (maxScrollScreen > 0) {
            coeff.value = containerRef.value.scrollTop / maxScrollScreen;
            thumbY.value = Math.round(maxScrollTrack * coeff.value);
        }
    }
}

const onMouseDown = (e) => {
    if (!isScollable.value) return;
    isDragging.value = true;
    startY.value = e.clientY;
    startThumbY.value = thumbY.value;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
}

const onMouseMove = (e) => {
    if (!isDragging.value) return;

    const deltaY = e.clientY - startY.value;
    const maxScrollTrack = scrollTrack.value.clientHeight - scrollThumb.value.clientHeight;

    let newThumbY = startThumbY.value + deltaY;
    newThumbY = Math.max(0, Math.min(newThumbY, maxScrollTrack));

    thumbY.value = newThumbY;

    // Update scroll position
    const maxScrollScreen = contentRef.value.scrollHeight - containerRef.value.clientHeight;
    const scrollRatio = newThumbY / maxScrollTrack;

    if (containerRef.value) {
        containerRef.value.scrollTop = scrollRatio * maxScrollScreen;
        coeff.value = scrollRatio;
    }
}

const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

onMounted(() => {
    const checkRefs = setInterval(() => {
        if (containerRef.value && contentRef.value) {
            updateScrollbar();
            containerRef.value.addEventListener('scroll', updateScrollbar);
            window.addEventListener('resize', updateScrollbar);
            clearInterval(checkRefs);
        }
    }, 100);
})

onUnmounted(() => {
    if (containerRef.value) {
        containerRef.value.removeEventListener('scroll', updateScrollbar);
    }
    window.removeEventListener('resize', updateScrollbar);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
})
</script>

<template>
    <div class="absolute top-0 right-0 w-8 h-full z-30 font-rubik py-[3dvw]">
        <div ref="scrollTrack" class="w-full h-full relative flex justify-center">
            <div ref="scrollThumb" v-if="isScollable" :data-scroll-thumb-y="thumbY" @mousedown="onMouseDown"
                :style="`top: ${thumbY}px`"
                class="w-5/8 cursor-pointer bg-neutral-300 absolute top-0 h-10 rounded-xs flex items-center justify-center">
                <span class="text-[12px] text-white rotate-270 text-left leading-none flex items-center justify-center">
                    {{ Math.round(coeff * 100) }}
                </span>
            </div>
        </div>
    </div>
</template>