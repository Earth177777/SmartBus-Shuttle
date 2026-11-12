import { BUS_SPEED_MPS } from './constants.js';

// A path of [x, z] points with arc-length lookup and free-flow travel times.
// `times` (seconds from the start, one per point) come from the router; without
// them the path is timed at a constant BUS_SPEED_MPS.
export function makePolyline(pts, times) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const length = cum[cum.length - 1];
  const tm = times && times.length === pts.length ? times : cum.map((d) => d / BUS_SPEED_MPS);
  const duration = tm[tm.length - 1];

  function segmentAt(arr, v) {
    let i = 1;
    while (i < arr.length - 1 && arr[i] < v) i++;
    return i;
  }

  function pointAt(d) {
    if (pts.length === 1) return { x: pts[0][0], z: pts[0][1], heading: 0 };
    const t = Math.min(Math.max(d, 0), length);
    const i = segmentAt(cum, t);
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const seg = cum[i] - cum[i - 1];
    const f = seg > 0 ? (t - cum[i - 1]) / seg : 0;
    return { x: ax + (bx - ax) * f, z: az + (bz - az) * f, heading: Math.atan2(bx - ax, bz - az) };
  }

  // Distance travelled after `t` free-flow seconds.
  function distanceAtTime(t) {
    if (pts.length === 1 || duration <= 0) return t > 0 ? length : 0;
    const tt = Math.min(Math.max(t, 0), duration);
    const i = segmentAt(tm, tt);
    const span = tm[i] - tm[i - 1];
    const f = span > 0 ? (tt - tm[i - 1]) / span : 1;
    return cum[i - 1] + (cum[i] - cum[i - 1]) * f;
  }

  return { pts, length, duration, pointAt, distanceAtTime };
}
