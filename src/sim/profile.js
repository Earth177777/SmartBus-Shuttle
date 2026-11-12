// Piecewise-linear value over the day from [hour, value] anchors (sorted by hour).
export function profileAt(anchors, clockSec) {
  const h = clockSec / 3600;
  if (h <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [h1, v1] = anchors[i];
    if (h <= h1) {
      const [h0, v0] = anchors[i - 1];
      return v0 + ((v1 - v0) * (h - h0)) / (h1 - h0);
    }
  }
  return anchors[anchors.length - 1][1];
}
