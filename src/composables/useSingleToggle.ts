import { ref } from 'vue'

const openIndex = ref();

export function useSingleToggle() {
  const isOpen = (index: number) => openIndex.value === index;

  const toggle = (index: number) => {
    openIndex.value = openIndex.value === index ? null : index;
  }

  return { openIndex, isOpen, toggle };
}