// Smart rerouting: a bus with free seats serves a crowded stop of another route that
// lies on (or just off) its own road. Generalises the pitch's slide-9 "smart stop".
//
//   reroute  ⇔  excess ≥ MIN_EXCESS
//            ∧  freeSeats ≥ MIN_FREE_SEATS
//            ∧  detour ≤ MAX_DETOUR_SEC
//            ∧  delaySoFar + detour ≤ PROMISE_BUFFER_SEC
//
//   excess = people waiting − seats arriving there within NEXT_BUS_WINDOW_SEC
//   detour = 2 × offRoadMetres / DETOUR_SPEED × traffic + STOP_SEC
//   riders taken = min(freeSeats, excess)

export const REROUTE = {
  CORRIDOR_M: 300, // a stop this close to a bus's path counts as "on its route"
  MIN_EXCESS: 5,
  MIN_FREE_SEATS: 3,
  MAX_DETOUR_SEC: 4 * 60,
  PROMISE_BUFFER_SEC: 8 * 60,
  NEXT_BUS_WINDOW_SEC: 20 * 60,
  DETOUR_SPEED_MPS: 20 / 3.6,
  STOP_SEC: 60,
};

export function shouldReroute({ excess, freeSeats, detourSec: detour, delaySec }) {
  return (
    excess >= REROUTE.MIN_EXCESS &&
    freeSeats >= REROUTE.MIN_FREE_SEATS &&
    detour <= REROUTE.MAX_DETOUR_SEC &&
    delaySec + detour <= REROUTE.PROMISE_BUFFER_SEC
  );
}

export function detourSec(offMetres, trafficFactor) {
  return ((2 * offMetres) / REROUTE.DETOUR_SPEED_MPS) * trafficFactor + REROUTE.STOP_SEC;
}

function closestOnPath(path, p) {
  let best = { off: Infinity, d: 0 };
  let along = 0;
  for (let i = 1; i < path.pts.length; i++) {
    const [ax, az] = path.pts[i - 1];
    const [bx, bz] = path.pts[i];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    const len = Math.sqrt(len2);
    const t = len2 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / len2)) : 0;
    const off = Math.hypot(p.x - ax - t * dx, p.z - az - t * dz);
    if (off < best.off) best = { off, d: along + t * len };
    along += len;
  }
  return best;
}

// Stops (from `stops`, {id: {x, z}}) within `radius` of the path: [{stopId, d, off}] by d.
export function corridorStops(path, stops, radius = REROUTE.CORRIDOR_M) {
  const out = [];
  for (const [stopId, s] of Object.entries(stops)) {
    const c = closestOnPath(path, s);
    if (c.off <= radius) out.push({ stopId, d: c.d, off: c.off });
  }
  return out.sort((a, b) => a.d - b.d);
}
