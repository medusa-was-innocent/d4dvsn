export const PLAYER_IDLE_MS = 7000;
export function nextPlayerMode(mode) {
  return mode === 'bubble' ? 'bar' : mode === 'bar' ? 'expanded' : 'bar';
}
