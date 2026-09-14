<script setup>
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import testimonials from '@/data/testimonials.json';
import TestimonialWriterCard from '@/components/TestimonialWriterCard.vue';
</script>

<template>
    <FramedMainSection id="principles" class="min-h-[100dvh] flex relative">
        <div class="mobile-principles w-full relative rounded-4xl text-white flex justify-center items-center text-center px-4 overflow-hidden">
            <img src="/optimized/backgrounds/sky.webp" width="3584" height="4800" alt="" decoding="async" class="absolute h-full w-full inset-0 object-cover -z-10" />
            <div class="flex flex-col gap-4 py-16">

                <div v-for="(testimonial, i) in testimonials" :key="i"
                    class="glass-panel principle-card h-fit flex-1 p-5 flex flex-col items-start cursor-default text-left rounded-3xl">
                    <TestimonialWriterCard 
                            :writerImage="testimonial.writer_image" 
                            :writerPosition="testimonial.writer_position" 
                            :starsCount="testimonial.stars" 
                            :isDarkMode="false"
                            />
                    <p class="pt-4 leading-relaxed">{{ testimonial.description }}</p>
                </div>
            </div>
        </div>
    </FramedMainSection>
</template>

<style scoped>
.mobile-principles { isolation: isolate; background: #aab8bf; }
.mobile-principles > img { z-index: 0; }
.mobile-principles > div { position: relative; z-index: 1; }
.principle-card { color: #17242c; --glass-tint: rgba(255, 255, 255, .76); }
</style>
