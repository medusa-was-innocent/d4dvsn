<script setup>
import FramedMainSection from '@/layouts/FramedMainSection.vue';
import ToggleSection from '@/components/ToggleSection.vue';
import { useSingleToggle } from '@/composables/useSingleToggle';
import projects from '@/data/projects.json';
import CustomA from '@/components/CustomA.vue';

const { isOpen, toggle } = useSingleToggle();
</script>

<template>
    <FramedMainSection id="projects" class="projects-section">
        <div class="w-full text-center pt-20">
            <div class="project-list w-full flex flex-col">
                <ToggleSection v-for="(project, pi) in projects" :key="project.title" :open="isOpen(pi)" @toggle="toggle(pi)">
                    <template #background>
                        <img :src="project.background" alt="" loading="lazy" decoding="async" class="project-background" />
                    </template>
                    <template #header>
                        <span class="tracking-[-0.1dvw] hidden md:block" aria-hidden="true">00-{{ String(pi + 1).padStart(2, '0') }}</span>
                        <span>{{ project.title }}</span>
                    </template>
                    <template #content>
                        <div v-if="isOpen(pi)" class="px-6 py-8">
                            <div class="relative w-full flex flex-col items-start gap-6">
                                <div class="project-preview-grid">
                                    <img :src="project.desktop_pic" :alt="`${project.title} preview`" loading="lazy" decoding="async" class="desktop-preview" />
                                    <p class="text-white leading-relaxed text-left">{{ project.description }}</p>
                                    <img :src="project.mobile_pic" :alt="`${project.title} mobile preview`" loading="lazy" decoding="async" class="mobile-preview" />
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
.projects-section { min-height: 100svh; overflow: visible; flex-shrink: 0; }
.project-preview-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(100px, .45fr); gap: 24px; align-items: center; width: 100%; }
.project-preview-grid img { width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 10px; }
@media (max-width: 767px) { .project-preview-grid { grid-template-columns: 1fr; } .project-preview-grid .mobile-preview { max-width: 180px; justify-self: center; } }
.project-link { padding: 14px 22px; background: #ffffffed; color: #17242c; border-radius: 999px; }
</style>
