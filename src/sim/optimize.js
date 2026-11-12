// Fleet optimizer: smallest number of buses per route that still runs the timetable well.
// Each candidate fleet is checked by replaying the whole weekday for that route alone.
import { createSim, stepSim, SERVICE_END } from './sim.js';

export const OPT = {
  MAX_LATE_PCT: 10, // at most this share of trips may leave late…
  LATE_SEC: 5 * 60, // …where "late" means more than 5 minutes after the timetable
  MAX_FLEET: 8,
  STEP_SEC: 15,
  SEED: 11,
};

// Replay one route's day with `fleet` buses.
export function evaluateFleet(line, routes, fleet) {
  const sim = createSim({ lines: [{ ...line, fleet }], routes, seed: OPT.SEED });
  while (sim.running) stepSim(sim, Math.min(OPT.STEP_SEC, SERVICE_END - sim.clock));
  const deps = sim.lines[line.id].deps.filter((d) => !d.extra);
  const late = deps.filter((d) => d.served && d.lateSec > OPT.LATE_SEC).length;
  const tel = sim.telemetry;
  return {
    lineId: line.id,
    fleet,
    trips: deps.length,
    unserved: deps.filter((d) => !d.served).length,
    late,
    latePct: deps.length ? (100 * late) / deps.length : 0,
    avgLateMin: deps.length ? deps.reduce((s, d) => s + (d.lateSec ?? 0), 0) / deps.length / 60 : 0,
    avgWaitMin: tel.agg.waitN ? tel.agg.waitSum / tel.agg.waitN / 60 : 0,
    extraBuses: sim.stats.extraBuses,
    boarded: sim.stats.boarded,
  };
}

const good = (r) => r.unserved === 0 && r.latePct <= OPT.MAX_LATE_PCT;
// Badness used when trimming under a cap: unserved trips weigh most, then late trips.
const cost = (r) => r.unserved * 1000 + r.late * 10 + r.avgLateMin;

// lines: route configs. options.maxBuses: cap on the whole network (optional).
export function optimizeFleet(lines, routes, { maxBuses = Infinity } = {}) {
  const results = lines.map((line) => {
    const tried = [];
    let pick = null;
    for (let f = 1; f <= OPT.MAX_FLEET; f++) {
      const r = evaluateFleet(line, routes, f);
      tried.push(r);
      if (good(r)) { pick = r; break; }
    }
    pick ??= tried.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    return { lineId: line.id, current: line.fleet, tried, recommended: pick.fleet, result: pick };
  });

  let total = results.reduce((n, r) => n + r.recommended, 0);
  const capped = total > maxBuses;
  // Trim one bus at a time from the route whose service suffers least, never below 1.
  while (total > maxBuses) {
    let best = null;
    for (const r of results) {
      if (r.recommended <= 1) continue;
      const fewer = r.tried.find((t) => t.fleet === r.recommended - 1) ?? evaluateFleet(lines.find((l) => l.id === r.lineId), routes, r.recommended - 1);
      const delta = cost(fewer) - cost(r.result);
      if (!best || delta < best.delta) best = { r, fewer, delta };
    }
    if (!best) break;
    best.r.recommended -= 1;
    best.r.result = best.fewer;
    total -= 1;
  }
  return { routes: results, total, capped, infeasible: total > maxBuses };
}
