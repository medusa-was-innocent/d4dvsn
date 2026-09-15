<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue';
import { useScrollContext } from '@/composables/useScrollContext';

const { containerRef, getSections, scroll } = useScrollContext();
const sections = computed(() => getSections());
const currentSection = ref('devson');
const hoveredSection = ref(null);
const menuOpen = ref(false);
const navRef = ref(null);
const menuButtonRef = ref(null);
const mobileMenuRef = ref(null);
const indicator = ref({ opacity: 0 });
let animationFrame = 0;
let resizeObserver;
let scrollContainer;
let disposed = false;

const label = (id) => id.replaceAll('-', ' ');
const updateIndicator = () => {
    const target = navRef.value?.querySelector(`[data-section="${hoveredSection.value || currentSection.value}"]`);
    if (target) indicator.value = { width: `${target.offsetWidth}px`, transform: `translateX(${target.offsetLeft}px)`, opacity: 1 };
};
const updateSection = () => {
    animationFrame = 0;
    if (disposed) return;
    const marker = Math.min(window.innerHeight * .32, 240);
    const active = [...sections.value].reverse().find(section => section.el.getBoundingClientRect().top <= marker);
    currentSection.value = active?.id || sections.value[0]?.id || 'devson';
    if (window.innerWidth >= 768) menuOpen.value = false;
};
const scheduleUpdate = () => {
    if (!disposed && !animationFrame) animationFrame = requestAnimationFrame(updateSection);
};
const closeMenu = (restoreFocus = false) => {
    menuOpen.value = false;
    if (restoreFocus) nextTick(() => menuButtonRef.value?.focus());
};
const navigate = (event, section) => {
    event.preventDefault();
    scroll(section.el);
    closeMenu();
};
const toggleMenu = async () => {
    menuOpen.value = !menuOpen.value;
    if (menuOpen.value) {
        await nextTick();
        mobileMenuRef.value?.querySelector('a')?.focus();
    }
};
const onKeydown = (event) => {
    if (event.key === 'Escape' && menuOpen.value) closeMenu(true);
};
watch([hoveredSection, currentSection, sections], () => nextTick(updateIndicator));
const resizeNavigation = () => { updateIndicator(); scheduleUpdate(); };
onMounted(async () => {
    await nextTick();
    if (disposed) return;
    scrollContainer = containerRef.value;
    scrollContainer?.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', resizeNavigation, { passive: true });
    window.addEventListener('keydown', onKeydown);
    resizeObserver = new ResizeObserver(resizeNavigation);
    if (navRef.value) resizeObserver.observe(navRef.value);
    updateSection();
    document.fonts?.ready.then(() => { if (!disposed) resizeNavigation(); });
});
onBeforeUnmount(() => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    scrollContainer?.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', resizeNavigation);
    window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
    <nav class="liquid-nav glass-panel" :class="{ 'on-paper': currentSection === 'projects' }" aria-label="Main navigation">
        <div ref="navRef" class="desktop-nav" @pointerleave="hoveredSection = null" @focusout="hoveredSection = null">
            <span class="nav-lens" :style="indicator" aria-hidden="true"></span>
            <a v-for="section in sections" :key="section.id" :href="`#${section.id}`" :data-section="section.id"
                :aria-current="currentSection === section.id ? 'location' : undefined"
                @pointerenter="hoveredSection = section.id" @focus="hoveredSection = section.id"
                @click="navigate($event, section)">{{ label(section.id) }}</a>
        </div>
        <button ref="menuButtonRef" class="mobile-toggle" type="button" :aria-expanded="menuOpen"
            aria-controls="mobile-navigation" aria-label="Toggle navigation" @click="toggleMenu">
            <span>{{ label(currentSection) }}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 8h16M4 16h16'" /></svg>
        </button>
    </nav>
    <div v-if="menuOpen" class="menu-backdrop" @click="closeMenu()" aria-hidden="true"></div>
    <Transition name="menu">
        <nav v-if="menuOpen" id="mobile-navigation" ref="mobileMenuRef" class="mobile-menu glass-panel" aria-label="Section navigation">
            <a v-for="section in sections" :key="section.id" :href="`#${section.id}`"
                :aria-current="currentSection === section.id ? 'location' : undefined"
                @click="navigate($event, section)">{{ label(section.id) }}<span aria-hidden="true">↗</span></a>
        </nav>
    </Transition>
</template>

<style scoped>
.liquid-nav { position: fixed; z-index: 70; top: max(20px, 4dvw); left: 50%; transform: translateX(-50%); border-radius: 999px; color: #fff; padding: 6px; --glass-tint: rgba(27, 35, 41, .24); --glass-solid: #4e565c; }
.desktop-nav { position: relative; display: flex; align-items: center; gap: 2px; }
.liquid-nav.on-paper { color: #24343d; --glass-tint: #cddce259; }
.on-paper .desktop-nav a { text-shadow: none; }
.desktop-nav a { position: relative; z-index: 1; display: block; padding: 10px 17px; border-radius: 999px; font-size: 14px; line-height: 1.45; text-shadow: 0 1px 8px #0005; white-space: nowrap; transition: color .2s; }
.nav-lens { position: absolute; left: 0; top: 0; bottom: 0; border: 1px solid #ffffff85; border-radius: 999px; background: linear-gradient(165deg, #ffffff68, #ffffff0a 55%, #ffffff30); box-shadow: inset 0 2px 3px #ffffffa0, inset 0 -1px 3px #ffffff60, 0 3px 12px #00000018; transition: transform .36s cubic-bezier(.22, 1, .36, 1), width .36s cubic-bezier(.22, 1, .36, 1), opacity .2s; pointer-events: none; }
.mobile-toggle { display: none; align-items: center; justify-content: space-between; gap: 26px; padding: 10px 16px; cursor: pointer; min-width: 166px; }
.mobile-toggle svg { height: 22px; width: 22px; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.menu-backdrop { position: fixed; inset: 0; z-index: 65; background: #08111a45; backdrop-filter: blur(5px); }
.mobile-menu { position: fixed; z-index: 70; top: 86px; left: 50%; transform: translateX(-50%); width: min(340px, calc(100vw - 32px)); padding: 12px; border-radius: 26px; color: white; --glass-tint: rgba(32, 40, 43, .48); --glass-solid: #343e45; }
.mobile-menu a { display: flex; align-items: center; justify-content: space-between; border-radius: 16px; padding: 15px 18px; font-size: 18px; }
.mobile-menu a:is(:hover, :focus-visible, [aria-current="location"]) { background: #ffffff23; }
.mobile-menu a span { opacity: .6; }
.menu-enter-active, .menu-leave-active { transition: opacity .2s, translate .2s; }
.menu-enter-from, .menu-leave-to { opacity: 0; translate: 0 -10px; }
@media (max-width: 767px) { .desktop-nav { display: none; } .mobile-toggle { display: flex; } .liquid-nav { top: 20px; } }
@media (min-width: 768px) { .mobile-menu, .menu-backdrop { display: none; } }
@media (prefers-reduced-motion: reduce) { .nav-lens, .menu-enter-active, .menu-leave-active { transition: none; } }
</style>
