<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useScrollContext } from '@/composables/useScrollContext';

defineProps({ contentSection: { type: HTMLElement, required: true } });
const { containerRef } = useScrollContext();
const trackRef = ref(null);
const sceneRef = ref(null);
const contentContainerRef = ref(null);
const highlightRef = ref(null);
const activeIndex = ref(0);
const itemCount = ref(0);
let scrollContainer;
let resizeObserver;
let animationFrame = 0;
let itemHeight = 0;
let disposed = false;
let motionQuery;
let stickyTop = 0;
let items = [];
let lastProgress = -1;

const registerContainer = (el) => { contentContainerRef.value = el; };
const tick = () => {
    animationFrame = 0;
    if (!contentContainerRef.value || !trackRef.value || !itemHeight) return;
    const travel = itemHeight * (itemCount.value - 1);
    const progress = Math.min(travel, Math.max(0, stickyTop - trackRef.value.getBoundingClientRect().top));
    if (progress === lastProgress) return;
    lastProgress = progress;
    contentContainerRef.value.style.transform = `translate3d(0, ${-progress}px, 0)`;
    activeIndex.value = Math.round(progress / itemHeight);
    items.forEach((el, index) => {
        const distance = index * itemHeight - progress;
        const rotation = motionQuery?.matches ? 0 : Math.max(-42, Math.min(42, distance / 6));
        el.style.transform = `perspective(1100px) rotateX(${rotation}deg)`;
    });
};
const scheduleTick = () => {
    if (!disposed && !animationFrame) animationFrame = requestAnimationFrame(tick);
};
const computeLayout = () => {
    if (disposed || !contentContainerRef.value || !sceneRef.value) return;
    items = Array.from(contentContainerRef.value.children);
    if (!items.length) return;
    stickyTop = parseFloat(getComputedStyle(sceneRef.value).top) || 0;
    lastProgress = -1;
    items.forEach(item => { item.style.height = 'auto'; });
    itemHeight = Math.ceil(Math.max(...items.map(item => item.offsetHeight)));
    itemCount.value = items.length;
    items.forEach(item => { item.style.height = `${itemHeight}px`; });
    highlightRef.value.style.height = `${itemHeight}px`;
    trackRef.value.style.height = `${sceneRef.value.offsetHeight + itemHeight * (items.length - 1)}px`;
    scheduleTick();
};
onMounted(() => {
    scrollContainer = containerRef.value;
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    scrollContainer?.addEventListener('scroll', scheduleTick, { passive: true });
    window.addEventListener('resize', computeLayout, { passive: true });
    motionQuery.addEventListener('change', computeLayout);
    resizeObserver = new ResizeObserver(computeLayout);
    resizeObserver.observe(sceneRef.value);
    computeLayout();
    document.fonts?.ready.then(computeLayout);
});
onBeforeUnmount(() => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    scrollContainer?.removeEventListener('scroll', scheduleTick);
    window.removeEventListener('resize', computeLayout);
    motionQuery?.removeEventListener('change', computeLayout);
});
</script>

<template>
    <div ref="trackRef" class="principles-track">
        <div ref="sceneRef" class="principles-scene">
            <div class="principles-art" aria-hidden="true"><slot name="background"></slot></div>
            <div class="principles-glass glass-panel">
                <div ref="highlightRef" class="principles-window">
                    <slot name="content" :registerContainer="registerContainer"></slot>
                </div>
                <div class="principles-pagination" aria-hidden="true">
                    <span v-for="index in itemCount" :key="index" :class="{ active: index - 1 === activeIndex }"></span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.principles-track { width: 100%; position: relative; min-height: calc(100dvh - 6dvw); }
.principles-scene { position: sticky; top: 3dvw; width: 100%; height: calc(100dvh - 6dvw); min-height: 440px; display: grid; place-items: center; border-radius: 32px; isolation: isolate; overflow: hidden; background: #aab8bf; }
.principles-art { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.principles-art :deep(img) { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.principles-glass { width: min(76%, 820px); border-radius: 38px; padding: 12px 20px 20px; --glass-tint: rgba(255, 255, 255, .48); color: #17242c; transition: box-shadow .25s; }
.principles-glass:hover { box-shadow: inset 0 1px 0 #ffffffdc, 0 18px 50px #10263824; }
.principles-window { overflow: hidden; perspective: 1100px; }
.principles-window :deep(.testimonial-item) { backface-visibility: hidden; transform-origin: center; }
.principles-pagination { display: flex; gap: 7px; justify-content: center; padding-top: 8px; }
.principles-pagination span { width: 5px; height: 5px; border-radius: 99px; background: #17242c40; transition: width .2s, background .2s; }
.principles-pagination .active { width: 22px; background: #17242ca0; }
@media (prefers-reduced-motion: reduce) { .principles-glass, .principles-pagination span { transition: none; } }
</style>
