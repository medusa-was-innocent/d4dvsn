<script setup>
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import ToggleSection from '@/components/ToggleSection.vue';
import { useSingleToggle } from '@/composables/useSingleToggle';
import projects from '@/data/projects.json';
import CustomA from '@/components/CustomA.vue';

const { isOpen, toggle } = useSingleToggle();
</script>

<template>
    <FramedMainSection id="projects" class="min-h-[100dvh] flex h-auto">
        <div class="flex-1 w-full flex flex-col text-center pt-20">
            <div class="project-list w-full h-full flex flex-col">
                <ToggleSection v-for="(project, pi) in projects" :key="project.title" :open="isOpen(pi)" @toggle="toggle(pi)">
                    <template #header>
                        <img :src="project.background" alt="" loading="lazy" decoding="async" class="project-background" />
                        <span class="tracking-[-0.1dvw] hidden md:block" aria-hidden="true">00-{{ String(pi + 1).padStart(2, '0') }}</span>
                        <span>{{ project.title }}</span>
                    </template>
                    <template #content>
                        <div v-if="isOpen(pi)" class="px-6 py-8">
                            <div class="relative w-full flex flex-col items-start gap-6">
                                <div class="gap-6 flex items-center flex-col lg:flex-row">
                                    <img :src="project.desktop_pic" :alt="`${project.title} preview`" loading="lazy" decoding="async" class="w-full lg:w-auto lg:max-w-[35%] lg:h-52 object-contain rounded-lg" />
                                    <p class="text-white leading-relaxed text-left">{{ project.description }}</p>
                                    <img :src="project.mobile_pic" :alt="`${project.title} mobile preview`" loading="lazy" decoding="async" class="h-52 max-w-40 object-contain hidden lg:block rounded-lg" />
                                </div>
                                <CustomA text="View more" :href="project.link" target="_blank" class="project-link" />
                            </div>
                        </div>
                    </template>
                </ToggleSection>
            </div>
        </div>
    </FramedMainSection>
</template>

<style scoped>
.project-list { overflow: hidden; border-radius: 28px; }
.project-link { padding: 14px 22px; background: #ffffffed; color: #17242c; border-radius: 999px; }
</style>
