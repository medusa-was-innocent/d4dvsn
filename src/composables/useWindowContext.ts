import { ref, computed } from 'vue'

const screenWidth = ref(window.innerWidth);

export function useWindowContext() {

  const resetWidth = () => {
    screenWidth.value = window.innerWidth;
  }

 const md = computed(() => screenWidth.value >= 768);

  return { resetWidth, md };
}
