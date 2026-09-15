// Keep reading time proportional to the viewport without long empty scrolls.
export function chapterHold(viewport) {
  return Math.max(260, Math.min(560, viewport * .52));
}

export function chapterState(segments, distance, previous = 0) {
  if (!segments.length) return { index: 0, progress: 0, pan: 0 };
  distance = Math.max(0, distance);
  let index = Math.max(0, Math.min(previous, segments.length - 1));
  let start = segments.slice(0, index).reduce((sum, segment) => sum + segment.length, 0);
  // A tiny reverse buffer avoids repeated transitions from trackpad bounce.
  while (index > 0 && distance < start - 14) start -= segments[--index].length;
  while (index < segments.length - 1 && distance >= start + segments[index].length) start += segments[index++].length;
  const segment = segments[index];
  const local = Math.max(0, distance - start);
  return {
    index,
    progress: Math.min(1, local / segment.length),
    pan: Math.min(segment.overflow, Math.max(0, local - segment.hold * .25)),
  };
}
