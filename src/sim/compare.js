// "Today vs SmartShuttle": the same weekday, same riders, run twice.
import { createSim, stepSim, SERVICE_END } from './sim.js';

// Same riders arrive the same way in both runs; only what the buses do differs.
export const TODAY = { extraBus: false, reroute: false };
export const SMART = { extraBus: true, reroute: true };
const STEP_SEC = 15;
const GIVE_UP_SEC = 60 * 60; // someone who gets no bus is assumed to give up after an hour

export function runDay(lines, routes, { smart = SMART, seed = 1, scenario = 'normal' } = {}) {
  const sim = createSim({ lines, routes, seed, scenario, smart });
  while (sim.running) stepSim(sim, Math.min(STEP_SEC, SERVICE_END - sim.clock));
  const a = sim.telemetry.agg;
  const s = sim.stats;
  // People still in a line when service ends never got a bus; they count as waiting
  // until they would have given up.
  let stranded = 0;
  let strandedWait = 0;
  for (const q of Object.values(sim.queues)) {
    for (const t of q.arrivals) {
      stranded++;
      strandedWait += Math.min(SERVICE_END - t, GIVE_UP_SEC);
    }
  }
  return {
    riders: s.boarded,
    stranded,
    avgWaitBoardedMin: a.waitN ? a.waitSum / a.waitN / 60 : 0,
    avgWaitMin: a.waitN + stranded ? (a.waitSum + strandedWait) / (a.waitN + stranded) / 60 : 0,
    maxWaitMin: a.waitMax / 60,
    waitedOver30: s.waitedOver30,
    leftBehind: s.leftBehind,
    emptySeatKm: s.emptySeatKm,
    busKm: s.busKm,
    extraBuses: s.extraBuses,
    reroutes: s.reroutes,
    lateTrips: s.lateDepartures,
  };
}

export function compareDays(lines, routes, { seed = 1, scenario = 'normal' } = {}) {
  const today = runDay(lines, routes, { smart: TODAY, seed, scenario });
  const smart = runDay(lines, routes, { smart: SMART, seed, scenario });
  const delta = Object.fromEntries(Object.keys(today).map((k) => [k, smart[k] - today[k]]));
  return { scenario, seed, today, smart, delta };
}
