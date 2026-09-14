<script setup>
import { ref, onMounted } from 'vue';
import TextAnim from '@/components/TextAnim.vue'
import FramedMainSection from '@/layouts/FramedMainSection.vue';

const frameRef = ref(null);
const containerRef = ref(null);

onMounted(() => {
    containerRef.value = frameRef.value.sectionRef;
});
</script>

<template>
    <FramedMainSection ref="frameRef" id="devson" class="h-dvh">
        <div 
            class="h-full w-full bg-fit bg-cover bg-position-[center_40%] rounded-4xl bg-[url('/optimized/backgrounds/mountains.webp')] flex flex-col justify-center items-center text-center">
            <div
                class="text-[#fff] font-rubik uppercase text-[10dvw] xl:text-[13dvh] leading-none flex flex-col justify-center items-center ">
                <p class="flex h-[8.4dvw] xl:h-[11dvh] ">In order</p>
                <p class="flex h-[8.4dvw] xl:h-[11dvh] overflow-hidden">
                    <span class="standard-text">to </span>
                    <TextAnim 
                        v-if="containerRef"
                        :texts="['Build', 'Develop', 'Impact', 'Change', 'Design']" 
                        :container="containerRef" 
                        :duration="2.5" 
                        :class="'text-red-custom'" 
                    />
                </p>
                <p class="flex h-[8.4dvw] xl:h-[11dvh] ">the future</p>
                <p class="flex h-[8.4dvw] xl:h-[11dvh] ">one line</p>
                <p class="flex h-[8.4dvw] xl:h-[11dvh] ">at a time.</p>
            </div>
        </div>
    </FramedMainSection>
</template>
