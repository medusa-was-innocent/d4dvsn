<script setup>
import FramedMainSection from '@/layouts/FramedMainSection.vue'
import stories from '@/data/about-me.json'
</script>

<template>
    <FramedMainSection id="about-me" class="min-h-[100dvh] flex relative">
        <div
            class="h-full w-full rounded-4xl bg-[url('/optimized/backgrounds/room.webp')] bg-cover bg-right text-white flex justify-center items-end text-center p-4">
            <div class="grid grid-cols-1 md:grid-cols-3">

                <div v-for="(story, i) in stories" :key="i"
                    class="h-fit flex-1 p-4 flex flex-col items-start cursor-default text-left gap-2">
                    <div class="rounded-2xl object-contain aspect-video w-full overflow-hidden">
                        <img :src="story.image" alt="" class="h-full w-full object-contain" />
                    </div>
                    <h1 class="font-bold text-xl leading-none font-rubik">{{ story.when }}</h1>
                    <p class="flex-1 h-fit">
                        {{ story.description }}
                    </p>
                </div>
            </div>
        </div>
    </FramedMainSection>
</template>
