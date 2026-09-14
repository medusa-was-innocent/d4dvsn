<script setup>
import { ref, defineExpose, onMounted, onBeforeUnmount, defineProps } from 'vue'
import { useScrollContext } from '@/composables/useScrollContext'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const sectionRef = ref(null);
const { registerSection, unregisterSection } = useScrollContext();

onMounted(() => registerSection(props.id, sectionRef.value));
onBeforeUnmount(() => unregisterSection(props.id));
defineExpose({ sectionRef });
</script>

<template>
    <section ref="sectionRef" :id="props.id" class="window w-full overflow-hidden p-[3dvw] snap-start">
        <slot></slot>
    </section>
</template>
