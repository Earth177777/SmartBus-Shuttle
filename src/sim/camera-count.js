// Turning camera detections into a line count (stop box, slide 6).
export function countPeople(predictions, minScore = 0.5) {
  return predictions.filter((p) => p.class === 'person' && p.score >= minScore).length;
}

// Median of recent counts, so a person blinking in and out doesn't make the number jump.
export function smoothCount(recent) {
  if (!recent.length) return 0;
  const s = [...recent].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
