<script setup>
import { ref, onMounted } from 'vue';
import FramedMainSection from '@/layouts/FramedMainSection.vue'
import testimonials from '@/data/testimonials.json'
import RotateOnScroll from '@/components/RotateOnScroll.vue'
import TestimonialWriterCard from '@/components/TestimonialWriterCard.vue';

const frameRef = ref(null);
const frameSectionRef = ref(null);

onMounted(async () => {
    frameSectionRef.value = frameRef.value.sectionRef;
})
</script>

<template>
    <FramedMainSection ref="frameRef" id="principles" class="principles-section min-h-[100dvh] relative">
        <RotateOnScroll v-if="frameSectionRef" :contentSection="frameSectionRef">
            <template #content="{ registerContainer }">
                <div class="h-full w-full bg-cover rounded-4xl text-center flex items-start relative">
                    <div :ref="registerContainer"
                        class="flex flex-col relative items-center w-fit z-30 perspective-distant text-black" style="height: auto;">
                        <div v-for="(testimonial, i) in testimonials" :key="i"
                            class="testimonial-item w-full text-left flex flex-col justify-center gap-4 py-8 px-6 lg:px-12 leading-relaxed">
                            <TestimonialWriterCard 
                            :writerImage="testimonial.writer_image" 
                            :writerPosition="testimonial.writer_position" 
                            :starsCount="testimonial.stars" 
                            />
                            <p>
                                {{ testimonial.description }}
                            </p>
                        </div>
                    </div>
                </div>
            </template>
            <template #background>
                <img src="/optimized/backgrounds/sky.webp" alt="" width="3584" height="4800" decoding="async" class="h-full w-full object-cover"/>
            </template>
        </RotateOnScroll>
    </FramedMainSection>
</template>

<style scoped>
/* Native sticky follows the shared scroll container without fixed/absolute swaps. */
.principles-section { overflow: visible; }
</style>
