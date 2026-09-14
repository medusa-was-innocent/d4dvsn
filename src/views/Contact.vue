<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import { useScrollContext } from '@/composables/useScrollContext';
import { AnimatedComponent } from '@/services/AnimatedComponent';
import contact from '@/data/contact.json';
import CustomA from '@/components/CustomA.vue';
import Parallax from '@/components/Parallax.vue';

const component = ref(null);
const frameRef = ref(null);
const { containerRef } = useScrollContext();
const translationRef = ref(0);
const handleScroll = () => {
    const top = frameRef.value.sectionRef.getBoundingClientRect().top;
    translationRef.value = Math.max(0, Math.min(window.innerHeight * .16, top * .22));
};
onMounted(() => {
    component.value = new AnimatedComponent(frameRef.value.sectionRef);
    component.value.tick = handleScroll;
    component.value.addAnimationTrigger(containerRef.value, 'scroll');
    component.value.addAnimationTrigger(window, 'resize');
    handleScroll();
});
onBeforeUnmount(() => component.value?.reset());
</script>

<template>
    <FramedMainSection ref="frameRef" id="contact" class="contact-section">
        <Parallax>
            <div class="contact-scene">
                <div class="contact-background" aria-hidden="true">
                    <img src="/optimized/contact/sky.webp" alt="" class="contact-sky" decoding="async" />
                    <img src="/optimized/contact/mountains.webp" alt="" data-parallax-value=".005" class="parallax contact-mountains" decoding="async" />
                    <img src="/optimized/contact/tower.webp" alt="" data-parallax-value=".025" class="parallax contact-tower" decoding="async" />
                </div>
                <div class="contact-links">
                    <div v-for="(value, key) in contact" :key="key" class="contact-group">
                        <h2 class="font-rubik">{{ key }}</h2>
                        <ul>
                            <li v-for="(link, index) in value" :key="index">
                                <CustomA v-if="!link.hidden" :text="link.text" :href="link.href" :target="link.target" />
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="contact-headline font-rubik">
                    <h2><span>Let's work</span><span class="text-red-custom">together</span></h2>
                </div>
                <div class="contact-foreground" :style="{ transform: `translateY(${translationRef}px)` }" aria-hidden="true">
                    <!-- body.png and arm.png were identical replacements, so render the figure once. -->
                    <img src="/optimized/contact/figure.webp" alt="" data-parallax-value=".15" class="parallax contact-figure" decoding="async" />
                </div>
            </div>
        </Parallax>
    </FramedMainSection>
</template>

<style scoped>
.contact-section { min-height: 100dvh; }
.contact-scene { position: relative; isolation: isolate; min-height: calc(100dvh - 6dvw); border-radius: 32px; overflow: hidden; display: flex; flex-direction: column; padding-top: 100px; color: #fff; }
.contact-background { position: absolute; inset: 0; z-index: -1; overflow: hidden; background: #171b25; }
.contact-sky { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; filter: brightness(.72); }
.contact-mountains { position: absolute; width: 110%; max-width: none; height: auto; left: -5%; bottom: 0; object-fit: contain; }
.contact-tower { position: absolute; left: 0; bottom: -3%; width: auto; height: 83%; max-width: 65%; object-fit: contain; object-position: left bottom; }
.contact-links { position: relative; z-index: 4; display: grid; grid-template-columns: minmax(300px, 1.25fr) 1fr .8fr; gap: 36px; padding: 0 36px; }
.contact-group { min-width: 0; }
.contact-group h2 { font-size: 18px; border-bottom: 1px dashed #ffffff70; padding-bottom: 8px; }
.contact-group ul { display: flex; flex-direction: column; gap: 9px; padding-top: 14px; font-size: clamp(16px, 1.65vw, 23px); }
.contact-group li { min-width: 0; max-width: 100%; }
.contact-headline { position: relative; z-index: 2; flex: 1; display: grid; place-items: center; min-height: 440px; text-align: center; padding: 44px 12px 80px; }
.contact-headline h2 { font-size: clamp(42px, 9vw, 142px); line-height: 1.04; }
.contact-headline span { display: block; }
.contact-foreground { position: absolute; inset: 0; z-index: 3; pointer-events: none; display: flex; align-items: flex-end; justify-content: center; }
.contact-figure { height: min(47dvh, 470px); width: auto; max-width: 45%; object-fit: contain; object-position: center bottom; }
@media (max-width: 1023px) and (min-width: 768px) {
    .contact-links { grid-template-columns: minmax(290px, 1.25fr) 1fr; gap: 24px; padding: 0 28px; }
    .contact-group:last-child { grid-column: 2; }
    .contact-group ul { font-size: 17px; }
}
@media (max-width: 767px) {
    .contact-links { grid-template-columns: 1fr 1fr; gap: 28px 20px; padding: 0 24px; }
    .contact-group:first-child { grid-column: 1 / -1; }
    .contact-group h2 { font-size: 14px; }
    .contact-group ul { font-size: clamp(15px, 4.2vw, 18px); }
    .contact-headline { min-height: 420px; padding-bottom: 200px; }
    .contact-tower { height: 54%; max-width: 82%; bottom: 0; }
    .contact-figure { height: 300px; max-width: 65%; }
}
</style>
