<script setup>
import { onMounted, computed, ref, useId, onBeforeUnmount } from 'vue'
import { AnimatedComponent } from '@/services/AnimatedComponent';

const props = defineProps({
  texts: {
    type: Array,
    required: true
  },
  duration: {
    type: Number,
    default: 2
  },
  container: {
    type: Object,
    default: null
  }
})

const component = ref(null);
const uniqueId = useId();
const wordRefs = ref([]);
const letterRefs = ref([]);

const setWordRef = (el) => {
  if (el) wordRefs.value.push(el);
}
const setLetterRef = (el) => {
  if (el) letterRefs.value.push(el);
}

const splitTexts = computed(() => {
  return [...props.texts, props.texts[0]].map(text => text.split(''));
})

const generateKeyframes = (stepCount, animName) => {
  const stepPercentage = 50 / stepCount;
  let keyframes = `@keyframes ${animName} {\n  0% { transform: translateY(0%); }\n`;

  for (let i = 0; i <= stepCount - 1; i++) {
    const position = (i + 1) * -100;
    keyframes += `${stepPercentage * i * 2 + stepPercentage}% { transform: translateY(${position}%); }\n`;
    keyframes += `${(stepPercentage * i + stepPercentage) * 2}% { transform: translateY(${position}%); }\n`;
  }

  return keyframes + `}`;
}

const enableAnimations = () => {
  letterRefs.value.forEach((l) => {
    l.classList.remove("pause");
  })
}

const disableAnimations = () => {
  letterRefs.value.forEach((l) => {
    l.classList.add("pause");
  })
}


onMounted(() => {
  const stepCount = wordRefs.value.length - 1;
  if (stepCount < 1) return;

  const animName = `slide-steps-${uniqueId}`;
  const style = document.createElement('style');

  style.textContent = generateKeyframes(stepCount, animName);
  document.head.appendChild(style)

  letterRefs.value.forEach((l) => {
    l.style.animation = `${animName} ${stepCount * props.duration}s cubic-bezier(0.25, 0.1, 0.25, 1.4) infinite`
    l.style.animationDelay = `calc(var(--i) * 100ms)`
  })

  component.value = new AnimatedComponent(props.container);
  component.value.enableAnimations = enableAnimations;
  component.value.disableAnimations = disableAnimations;
  component.value.autoAnimate();
})

onBeforeUnmount(() => {
  component.value.reset();
})
</script>

<template>
  <div>
    <p v-for="(letters, wi) in splitTexts" :key="wi" class="word flex" :ref="setWordRef">
      <span v-for="(letter, li) in letters" :key="li" class="letter" :ref="setLetterRef" :style="{ '--i': li }">
        {{ letter }}
      </span>
    </p>
  </div>
</template>
