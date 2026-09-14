import { ref } from 'vue'

const positions = ref({x: 0, y: 0});

export function useCursorContext() {

  const setPositions = (x: number, y: number) => {
    positions.value = {x, y};
  }
  
  const getPositions = () => {
    return {x: positions.value.x, y: positions.value.y};
  }

  return { getPositions, setPositions };
}
