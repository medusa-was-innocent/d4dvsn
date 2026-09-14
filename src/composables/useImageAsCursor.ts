import { ref } from 'vue'

const imageUrl = ref();
const isOpen = ref(false);
const isUrl = ref(false);
const isSmall = ref(false);

export function useImageAsCursor() {
  const setIsOpen = (value: boolean) => {
    isOpen.value = value;
  }

  const setIsSmall = (value: boolean) => {
    isSmall.value = value;
  }

  const setImage = (url: string) => {
    imageUrl.value = url;
  }

  const setIsUrl = (value: boolean) => {
    isUrl.value = value;
  }

  return { imageUrl, isOpen, isUrl, isSmall, setIsOpen, setImage, setIsUrl, setIsSmall }
}