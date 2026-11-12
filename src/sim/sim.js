import { createBus, startTrip, advanceBus, etaSeconds, BUS_SPEED_MPS, BUS_CAPACITY } from './bus.js';
import { arrivalsPerMinute } from './arrivals.js';
import { shouldStopAtLrt, needsExtraBus } from './rules.js';

export const SERVICE_START = 7 * 3600;
export const SERVICE_END = 22 * 3600;
export const DWELL_SEC = 60;
export const LRT_HEADWAY_SEC = 20 * 60; // per bus; L1 and L2 alternate → a bus every 10 min
export const PARKHILL_HEADWAY_SEC = 15 * 60;
export const PARKHILL_OFFSET_SEC = 8 * 60;
export const PROMISE_BUFFER = 1.1;
const ALERT_TTL_SEC = 10 * 60;

// Deterministic PRNG so the same seed replays the same day.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const travelSec = (path) => path.length / BUS_SPEED_MPS;

export function createSim({ routes, seed = 1 }) {
  const sim = {
    clock: SERVICE_START,
    running: true,
    routes,
    rng: mulberry32(seed),
    stops: {
      apu: { queue: 0, acc: 0 },
      lrt: { queue: 0, acc: 0 },
      parkhill: { queue: 0, acc: 0 },
    },
    buses: [],
    alerts: [],
    stats: { boarded: 0, smartStops: 0, extraBuses: 0 },
    nextExtraId: 1,
  };
  const L1 = makeLineBus('L1', 'lrt', 'lrt', SERVICE_START);
  const L2 = makeLineBus('L2', 'lrt', 'lrt', SERVICE_START + LRT_HEADWAY_SEC / 2);
  // Parkhill departures staggered 8 min off the LRT pickups (07:08, 07:23, …), so the
  // bus passes when the LRT line has built up rather than just after it was cleared.
  const P1 = makeLineBus('P1', 'parkhill', 'parkhill', SERVICE_START + PARKHILL_OFFSET_SEC);
  sim.buses.push(L1, L2, P1);
  return sim;
}

function makeLineBus(id, line, home, firstDeparture) {
  const bus = createBus(id, line);
  bus.atStop = home;
  bus.nextDep = firstDeparture;
  bus.legs = [];
  return bus;
}

function cycleLegs(sim, bus) {
  const r = sim.routes;
  if (bus.extra) return null; // extra buses do one run, then leave
  if (bus.line === 'lrt') {
    const legs = [
      { type: 'wait', until: bus.nextDep },
      { type: 'dwell', stop: 'lrt', board: true },
      { type: 'drive', path: r.lrt_apu, dest: 'apu', alight: true },
      { type: 'dwell', stop: 'apu', board: true },
      { type: 'drive', path: r.apu_lrt, dest: 'lrt', alight: true },
    ];
    bus.nextDep += LRT_HEADWAY_SEC;
    return legs;
  }
  const legs = [
    { type: 'wait', until: bus.nextDep },
    { type: 'dwell', stop: 'parkhill', board: true },
    { type: 'decide' },
  ];
  bus.nextDep += PARKHILL_HEADWAY_SEC;
  return legs;
}

// The smart-stop choice, made as the Parkhill bus leaves Parkhill.
function decideParkhillLegs(sim, bus) {
  const r = sim.routes;
  const viaLrtEtaSec = travelSec(r.parkhill_lrt) + DWELL_SEC + travelSec(r.lrt_apu);
  const lrtBusComing = sim.buses.some((b) => b.line === 'lrt' && (b.dest === 'lrt' || b.atStop === 'lrt'));
  const stop = shouldStopAtLrt({
    lrtQueue: sim.stops.lrt.queue,
    nextLrtBusSeats: lrtBusComing ? BUS_CAPACITY : 0,
    freeSeats: bus.capacity - bus.load,
    viaLrtEtaSec,
    promisedEtaSec: viaLrtEtaSec * PROMISE_BUFFER,
  });
  const home = [
    { type: 'dwell', stop: 'apu', board: false },
    { type: 'drive', path: r.apu_parkhill, dest: 'parkhill', alight: true },
  ];
  if (!stop) return [{ type: 'drive', path: r.parkhill_apu, dest: 'apu', alight: true }, ...home];
  sim.stats.smartStops++;
  return [
    { type: 'drive', path: r.parkhill_lrt, dest: 'lrt', alight: false, smartStop: true },
    { type: 'dwell', stop: 'lrt', board: true },
    { type: 'drive', path: r.lrt_apu, dest: 'apu', alight: true },
    ...home,
  ];
}

function board(sim, bus, stopId) {
  const s = sim.stops[stopId];
  const n = Math.min(s.queue, bus.capacity - bus.load);
  s.queue -= n;
  bus.load += n;
  sim.stats.boarded += n;
}

function dispatchExtra(sim) {
  const extraInFlight = sim.buses.some((b) => b.extra);
  if (!needsExtraBus(sim.stops.lrt.queue, BUS_CAPACITY, extraInFlight)) return;
  const r = sim.routes;
  const bus = createBus(`X${sim.nextExtraId++}`, 'lrt');
  bus.extra = true;
  bus.atStop = 'apu';
  bus.legs = [
    { type: 'drive', path: r.apu_lrt, dest: 'lrt', alight: true },
    { type: 'dwell', stop: 'lrt', board: true },
    { type: 'drive', path: r.lrt_apu, dest: 'apu', alight: true },
  ];
  sim.buses.push(bus);
  sim.stats.extraBuses++;
  const min = Math.ceil(travelSec(r.apu_lrt) / 60);
  sim.alerts.push({ t: sim.clock, stopId: 'lrt', text: `Line is longer than one bus: 2nd bus called · arriving in ${min} min` });
  if (sim.alerts.length > 20) sim.alerts.shift();
}

// Advance one bus by dt seconds, carrying leftover time across legs.
function stepBus(sim, bus, dt) {
  for (let guard = 0; guard < 16 && dt > 1e-9; guard++) {
    if (bus.legs.length === 0) {
      const next = cycleLegs(sim, bus);
      if (!next) { bus.done = true; return; }
      bus.legs = next;
    }
    const leg = bus.legs[0];
    if (leg.type === 'wait') {
      if (sim.clock < leg.until) return;
      bus.legs.shift();
    } else if (leg.type === 'decide') {
      bus.legs.splice(0, 1, ...decideParkhillLegs(sim, bus));
    } else if (leg.type === 'dwell') {
      if (bus.state !== 'dwelling') {
        bus.state = 'dwelling';
        bus.dwellLeft = DWELL_SEC;
        bus.atStop = leg.stop;
      }
      const take = Math.min(dt, bus.dwellLeft);
      bus.dwellLeft -= take;
      dt -= take;
      if (bus.dwellLeft <= 1e-9) {
        if (leg.board) board(sim, bus, leg.stop);
        bus.state = 'idle';
        bus.legs.shift();
      }
    } else if (leg.type === 'drive') {
      if (bus.state !== 'driving') {
        startTrip(bus, leg.path, leg.dest);
        bus.atStop = null;
        bus.smartStop = !!leg.smartStop;
      }
      const take = Math.min(dt, (bus.path.length - bus.d) / BUS_SPEED_MPS);
      dt -= take;
      if (advanceBus(bus, take) === 'arrived' || bus.d >= bus.path.length) {
        bus.state = 'idle';
        bus.atStop = leg.dest;
        bus.dest = null;
        bus.smartStop = false;
        if (leg.alight) bus.load = 0;
        bus.legs.shift();
      }
    }
  }
}

function addArrivals(sim, dt) {
  const hour = Math.floor(sim.clock / 3600);
  for (const [id, s] of Object.entries(sim.stops)) {
    s.acc += (arrivalsPerMinute(id, hour) / 60) * dt * (0.5 + sim.rng());
    const n = Math.floor(s.acc);
    s.acc -= n;
    s.queue += n;
  }
}

export function stepSim(sim, dtSec) {
  if (!sim.running) return;
  const dt = Math.min(dtSec, SERVICE_END - sim.clock);
  if (dt > 0) {
    addArrivals(sim, dt);
    dispatchExtra(sim);
    for (const bus of sim.buses) stepBus(sim, bus, dt);
    sim.buses = sim.buses.filter((b) => !b.done);
    sim.clock += dt;
  }
  if (sim.clock >= SERVICE_END) sim.running = false;
}

// What the stop's screen shows (pitch slide 7).
export function stopScreen(sim, stopId) {
  const inLine = sim.stops[stopId].queue;
  const alertObj = [...sim.alerts].reverse().find((a) => a.stopId === stopId && sim.clock - a.t <= ALERT_TTL_SEC);
  const alert = alertObj ? alertObj.text : null;
  if (!sim.running || sim.clock < SERVICE_START || sim.clock >= SERVICE_END) {
    return { nextBusMin: null, inLine, status: 'Offline', alert: null };
  }
  let best = Infinity;
  let ongoing = false;
  for (const b of sim.buses) {
    if (b.state === 'driving' && b.dest === stopId) {
      ongoing = true;
      best = Math.min(best, etaSeconds(b));
    } else if (b.state === 'dwelling' && b.atStop === stopId) {
      ongoing = true;
      best = 0;
    } else if (b.atStop === stopId && b.legs?.[0]?.type === 'wait') {
      best = Math.min(best, Math.max(0, b.legs[0].until - sim.clock));
    }
  }
  return {
    nextBusMin: best === Infinity ? null : Math.ceil(best / 60),
    inLine,
    status: ongoing ? 'Ongoing' : 'Waiting',
    alert,
  };
}
