<script setup>
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import awards from '@/data/awards.json';
import Parallax from '@/components/Parallax.vue';
</script>

<template>
    <FramedMainSection id="milestones" class="awards-section">
        <Parallax>
            <div class="awards-scene">
                <div class="awards-background" aria-hidden="true">
                    <img src="/optimized/awards/sky.webp" alt="" class="awards-sky" decoding="async" />
                    <div data-parallax-value=".02" class="parallax awards-clouds"></div>
                    <div class="lily-ground" aria-hidden="true"></div>
                    <img src="/optimized/awards/lily.webp" alt="" data-parallax-value=".06" data-parallax-axis="x" class="parallax awards-lily" decoding="async" />
                </div>
                <div class="awards-copy">
                    <article v-for="award in awards" :key="award.date" class="award-item">
                        <span class="font-rubik award-year">{{ award.date }}</span>
                        <h2 class="font-rubik text-xl italic">{{ award.title }}</h2>
                        <p>{{ award.description }}</p>
                    </article>
                </div>
            </div>
        </Parallax>
    </FramedMainSection>
</template>

<style scoped>
.awards-section { min-height: 100dvh; }
.awards-scene { position: relative; min-height: calc(100dvh - 6dvw); height: 100%; border-radius: 32px; overflow: hidden; isolation: isolate; display: flex; align-items: flex-end; color: white; }
.awards-background { position: absolute; inset: 0; z-index: -1; background: #303530; }
.awards-sky { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.awards-clouds { position: absolute; width: 115%; aspect-ratio: 16 / 9; top: 0; left: -7.5%; background: url('/optimized/awards/clouds.webp') center / cover; opacity: .6; }
.awards-lily { position: absolute; left: 50%; bottom: 7%; translate: -50% 0; width: auto; height: 72%; max-width: 65%; object-fit: contain; object-position: center bottom; mask-image: linear-gradient(#000 93%, transparent 100%); }
.lily-ground { position: absolute; left: 50%; bottom: 5%; translate: -50% 0; width: 210px; height: 38px; border-radius: 50%; background: radial-gradient(ellipse, #142416b3, transparent 70%); }
.awards-copy { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; width: 100%; padding: 80px 36px 32px; background: linear-gradient(transparent, #121d1dc2 38%, #121d1de0); }
.award-item { min-width: 0; text-align: left; }
.award-year { display: block; font-size: 13px; margin-bottom: 10px; opacity: .8; }
.award-item h2 { font-size: clamp(14px, 1.2vw, 20px); line-height: 1.4; margin-bottom: 12px; }
.award-item p { font-size: 14px; line-height: 1.7; }
@media (max-width: 767px) {
    .awards-lily { top: 120px; bottom: auto; height: 390px; max-width: 88%; }
    .lily-ground { top: 484px; bottom: auto; width: 160px; }
    .awards-copy { grid-template-columns: 1fr; padding: 420px 24px 32px; gap: 24px; background: linear-gradient(transparent 20%, #121d1dc2 45%, #121d1de0); }
    .award-item h2 { font-size: 17px; }
}
</style>
