<script setup>
import ScrollBar from '@/components/Scrollbar.vue';
import LiquidNavbar from '@/components/LiquidNavbar.vue';
import Home from '@/views/Home.vue';
import AboutMe from '@/views/AboutMe.vue';
import AboutMeMobile from '@/views/AboutMeMobile.vue';
import Projects from '@/views/Projects.vue';
import Awards from '@/views/Awards.vue';
import Testimonials from '@/views/Testimonials.vue';
import TestimonialsMobile from '@/views/TestimonialsMobile.vue';
import Contact from '@/views/Contact.vue';
import MusicPlayer from '@/components/MusicPlayer.vue';
import { provideScrollContext } from '@/composables/useScrollContext';
import { useCursorContext } from '@/composables/useCursorContext';
import { useWindowContext } from '@/composables/useWindowContext';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { AnimatedComponent } from '@/services/AnimatedComponent';

const { containerRef, contentRef } = provideScrollContext();
const { setPositions } = useCursorContext();
const { resetWidth, md } = useWindowContext();

const component = ref();
const windowComponent = ref();

const setCursorPos = (e) => {
  if (e instanceof MouseEvent) setPositions(e.clientX, e.clientY);
}

onMounted(() => {
  const trackerUrl = import.meta.env.VITE_TRACKER_URL;
  if (trackerUrl) fetch(trackerUrl).catch(() => {});
  component.value = new AnimatedComponent();
  component.value.tick = setCursorPos;
  component.value.addAnimationTrigger(window, "mousemove");

  windowComponent.value = new AnimatedComponent();
  windowComponent.value.tick = resetWidth;
  windowComponent.value.addAnimationTrigger(window, "resize");
})

onBeforeUnmount(() => {
  component.value?.reset();
  windowComponent.value?.reset();
});
</script>

<template>
  <section id="loading"
    class="outline-[100dvw] outline-white rounded-[999px] bg-transparent h-0 w-0 fixed top-1/2 left-1/2 z-[100] -translate-1/2 flex items-center justify-center">
    <span class="absolute font-ledger h-40 w-96 flex justify-center items-center">The paint is drying...</span>
  </section>
  <ScrollBar />
  <MusicPlayer />
  <div ref="containerRef" id="container" class="overflow-auto h-dvh flex flex-col items-center font-ledger"
    style="scrollbar-width: none;">
    <LiquidNavbar />
    <div ref="contentRef" id="content" class=" w-full flex flex-col">
      <Home />
      <AboutMe v-if="md" />
      <AboutMeMobile v-else />
      <Projects />
      <Awards />
      <Testimonials v-if="md" />
      <TestimonialsMobile v-else />
      <Contact />
      <footer class="relative">
        <span class="absolute bottom-0 text-sm p-[4dvw] opacity-60 text-white">
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
#loading {
  animation: 1.5s resize 3s ease-in-out forwards,
    0s hide 4s forwards;

  span {
    animation: 1s hide 2s forwards;
  }
}

@keyframes resize {
  to {
    width: 150dvw;
    height: 150dvh;
    border-radius: 0px;
  }
}

@keyframes hide {
  to {
    opacity: 0;
    display: none;
    pointer-events: none;
    visibility: hidden;
    z-index: -1;
  }
}
</style>
