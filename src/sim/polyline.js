// A path of [x, z] points with arc-length lookup.
export function makePolyline(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const length = cum[cum.length - 1];

  function pointAt(d) {
    if (pts.length === 1) return { x: pts[0][0], z: pts[0][1], heading: 0 };
    const t = Math.min(Math.max(d, 0), length);
    let i = 1;
    while (i < pts.length - 1 && cum[i] < t) i++;
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const seg = cum[i] - cum[i - 1];
    const f = seg > 0 ? (t - cum[i - 1]) / seg : 0;
    return { x: ax + (bx - ax) * f, z: az + (bz - az) * f, heading: Math.atan2(bx - ax, bz - az) };
  }

  return { pts, length, pointAt };
}
