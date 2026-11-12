// Timetable-driven simulation of APU Campus Connect.
// Buses run APU's published trips; empty buses reposition ("deadhead") for their next
// trip; a spare bus is called when a line overflows; traffic stretches travel times.
import { createBus, startTrip, advanceBus, etaSeconds } from './bus.js';
import { makePolyline } from './polyline.js';
import { buildDepartures, pickupOffsetSec } from './schedule.js';
import { demandPerMinute, peakRateForTimetable } from './demand.js';
import { trafficFactor, BUS_SLOWDOWN } from './traffic.js';
import { needsExtraBus } from './rules.js';

export const SERVICE_START = 6.5 * 3600; // 06:30
export const SERVICE_END = 22.5 * 3600; // 22:30
export const DWELL_SEC = 60;
export const LIMITED_SHARE = 0.5; // "** Limited space only" trips
const ALERT_TTL_SEC = 10 * 60;
const DEADHEAD_SLACK_SEC = 10 * 60; // arrive this early for a trip
const EXTRA_GAP_SEC = 10 * 60; // only call an extra bus if the next trip is further away than this
const DEFAULT_LOAD = 0.6; // share of scheduled seats a day's riders fill
const FAST_FORWARD_STEP = 10;

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

const travelFactor = (clock) => trafficFactor(clock) * BUS_SLOWDOWN;
const backKey = (lineId) => `apu:${lineId}`;

export function createSim({ lines, routes, seed = 1, startClock = SERVICE_START }) {
  const sim = {
    clock: SERVICE_START,
    running: true,
    rng: mulberry32(seed),
    lines: {},
    order: lines.map((l) => l.id),
    buses: [],
    queues: {},
    alerts: [],
    stats: { boarded: 0, extraBuses: 0, lateDepartures: 0 },
  };
  const routeById = Object.fromEntries(routes.lines.map((r) => [r.id, r]));
  for (const cfg of lines) {
    const r = routeById[cfg.id];
    const toPoly = (leg) => ({ from: leg.from, to: leg.to, path: makePolyline(leg.pts, leg.times) });
    const deps = buildDepartures(cfg).map((d) => ({ ...d, served: false }));
    const load = cfg.load ?? DEFAULT_LOAD;
    const trips = (dir) => deps.filter((d) => d.dir === dir).length;
    const peak = {
      out: peakRateForTimetable(trips('out'), cfg.capacity, load, 'out'),
      back: peakRateForTimetable(trips('back'), cfg.capacity, load, 'back'),
    };
    const L = { cfg, deps, peak, out: r.outbound.map(toPoly), back: r.inbound.map(toPoly) };
    sim.lines[cfg.id] = L;
    for (const stop of cfg.pickups) sim.queues[stop] = { queue: 0, acc: 0, lineId: cfg.id, dir: 'out' };
    sim.queues[backKey(cfg.id)] = { queue: 0, acc: 0, lineId: cfg.id, dir: 'back' };
    for (let i = 0; i < cfg.fleet; i++) {
      const bus = createBus(`${cfg.code.split(' ')[0].replace('.', '')}${i + 1}`, cfg.id, cfg.capacity);
      bus.vehicle = cfg.vehicle;
      bus.at = cfg.pickups[0];
      bus.legs = [];
      bus.trip = null;
      sim.buses.push(bus);
    }
  }
  while (sim.clock < startClock && sim.running) stepSim(sim, Math.min(FAST_FORWARD_STEP, startClock - sim.clock));
  sim.alerts = sim.alerts.filter((a) => startClock - a.t <= ALERT_TTL_SEC);
  return sim;
}

const originOf = (L, dir) => (dir === 'out' ? L.cfg.pickups[0] : 'apu');
const legsFor = (L, dir) => (dir === 'out' ? L.out : L.back);

// Free-flow seconds for a whole direction, stretched by traffic at `clock`, plus dwells.
export function estimateTripSec(sim, lineId, dir, clock) {
  const L = sim.lines[lineId];
  const legs = legsFor(L, dir);
  return legs.reduce((s, l) => s + l.path.duration, 0) * travelFactor(clock) + DWELL_SEC * legs.length;
}

function tripLegs(L, dir, trip) {
  const legs = [];
  const pathLegs = legsFor(L, dir);
  const drops = pathLegs.length;
  pathLegs.forEach((leg, i) => {
    if (dir === 'out') legs.push({ type: 'dwell', stop: leg.from, board: leg.from });
    else if (i === 0) legs.push({ type: 'dwell', stop: 'apu', board: backKey(L.cfg.id) });
    else legs.push({ type: 'dwell', stop: leg.from, alightShare: 1 / (drops - i + 1) });
    legs.push({ type: 'drive', path: leg.path, dest: leg.to, alightAll: i === drops - 1 });
  });
  legs.trip = trip;
  return legs;
}

function deadheadLegs(L, fromStop) {
  const dir = fromStop === 'apu' ? 'back' : 'out';
  return legsFor(L, dir).map((leg) => ({ type: 'drive', path: leg.path, dest: leg.to, alightAll: true }));
}

function assignTrip(sim, bus, L, dep) {
  dep.served = true;
  dep.lateSec = Math.max(0, sim.clock - dep.t);
  if (!dep.extra && dep.lateSec > 120) sim.stats.lateDepartures++;
  bus.trip = dep;
  bus.legs = tripLegs(L, dep.dir, dep);
}

const isFree = (b) => b.state === 'idle' && b.legs.length === 0;

function dispatchLine(sim, L) {
  const now = sim.clock;
  const buses = sim.buses.filter((b) => b.line === L.cfg.id);
  const freeAt = (stop) => buses.filter((b) => isFree(b) && b.at === stop);
  const headingTo = (stop) => buses.filter((b) => !isFree(b) && finalStop(b) === stop);

  // 1. Due departures take a free bus waiting at their origin (late if none is there yet).
  for (const dep of L.deps) {
    if (dep.served || dep.t > now) continue;
    const bus = freeAt(originOf(L, dep.dir))[0];
    if (bus) assignTrip(sim, bus, L, dep);
  }

  // 2. Reposition free buses towards the terminal that will need them.
  for (const bus of buses.filter(isFree)) {
    const A = bus.at;
    const B = A === 'apu' ? L.cfg.pickups[0] : 'apu';
    const dirA = A === 'apu' ? 'back' : 'out';
    const dirB = dirA === 'out' ? 'back' : 'out';
    const T = estimateTripSec(sim, L.cfg.id, dirA, now);
    const upcoming = (dir, horizon) => L.deps.filter((d) => !d.served && d.dir === dir && d.t <= now + horizon).length;
    const needB = upcoming(dirB, T + DEADHEAD_SLACK_SEC);
    const supplyB = freeAt(B).length + headingTo(B).length;
    const needA = upcoming(dirA, 2 * T + DEADHEAD_SLACK_SEC);
    const supplyA = freeAt(A).length + headingTo(A).length;
    if (needB > supplyB && supplyA - 1 >= needA) {
      bus.legs = deadheadLegs(L, A);
      bus.trip = null;
    }
  }

  // 3. Crowd-aware: a line longer than one bus, with the next trip far away, gets a spare bus.
  if (buses.some((b) => b.trip?.extra)) return;
  for (const dir of ['out', 'back']) {
    const origin = originOf(L, dir);
    const qKey = dir === 'out' ? origin : backKey(L.cfg.id);
    const next = L.deps.find((d) => !d.served && d.dir === dir);
    const gap = next ? next.t - now : Infinity;
    if (!needsExtraBus(sim.queues[qKey].queue, L.cfg.capacity, false) || gap <= EXTRA_GAP_SEC) continue;
    // A spare bus must be back before its next scheduled trip: one round trip plus slack.
    const freeFor = estimateTripSec(sim, L.cfg.id, 'out', now) + estimateTripSec(sim, L.cfg.id, 'back', now) + DEADHEAD_SLACK_SEC;
    const busyWithin = (stop) => L.deps.filter((d) => !d.served && originOf(L, d.dir) === stop && d.t <= now + freeFor).length;
    const here = freeAt(origin);
    const otherStop = origin === 'apu' ? L.cfg.pickups[0] : 'apu';
    const there = freeAt(otherStop);
    let bus = null;
    let arriveSec = 0;
    if (here.length > busyWithin(origin)) bus = here[0];
    else if (there.length > busyWithin(otherStop)) {
      bus = there[0];
      arriveSec = estimateTripSec(sim, L.cfg.id, origin === 'apu' ? 'out' : 'back', now);
    }
    if (!bus) continue;
    const dep = { t: now, dir, limited: false, continuous: false, extra: true, served: false };
    L.deps.push(dep);
    if (arriveSec > 0) {
      bus.legs = [...deadheadLegs(L, otherStop), ...tripLegs(L, dir, dep)];
      bus.legs.trip = dep;
      bus.trip = dep;
      dep.served = true;
      dep.lateSec = 0;
    } else {
      assignTrip(sim, bus, L, dep);
    }
    sim.stats.extraBuses++;
    const min = Math.max(1, Math.ceil(arriveSec / 60));
    sim.alerts.push({ t: now, stopId: dir === 'out' ? origin : 'apu', lineId: L.cfg.id, text: `Line is longer than one bus: extra bus called · arriving in ${min} min` });
    if (sim.alerts.length > 30) sim.alerts.shift();
    return;
  }
}

function finalStop(bus) {
  for (let i = bus.legs.length - 1; i >= 0; i--) if (bus.legs[i].type === 'drive') return bus.legs[i].dest;
  return bus.state === 'driving' ? bus.dest : bus.at;
}

function board(sim, bus, qKey) {
  const q = sim.queues[qKey];
  const seats = bus.trip?.limited ? Math.floor(bus.capacity * LIMITED_SHARE) : bus.capacity;
  const n = Math.max(0, Math.min(q.queue, seats - bus.load));
  q.queue -= n;
  bus.load += n;
  sim.stats.boarded += n;
}

function stepBus(sim, bus, dt) {
  const factor = travelFactor(sim.clock);
  for (let guard = 0; guard < 16 && dt > 1e-9 && bus.legs.length; guard++) {
    const leg = bus.legs[0];
    if (leg.type === 'dwell') {
      if (bus.state !== 'dwelling') {
        bus.state = 'dwelling';
        bus.dwellLeft = DWELL_SEC;
        bus.at = leg.stop;
        if (leg.alightShare) bus.load -= Math.round(bus.load * leg.alightShare);
      }
      const take = Math.min(dt, bus.dwellLeft);
      bus.dwellLeft -= take;
      dt -= take;
      if (bus.dwellLeft <= 1e-9) {
        if (leg.board) board(sim, bus, leg.board);
        bus.state = 'idle';
        bus.legs.shift();
      }
    } else {
      if (bus.state !== 'driving') {
        startTrip(bus, leg.path, leg.dest);
        bus.at = null;
      }
      const take = Math.min(dt, (bus.path.duration - bus.tt) * factor);
      dt -= take;
      if (advanceBus(bus, take, factor) === 'arrived' || bus.tt >= bus.path.duration) {
        bus.state = 'idle';
        bus.at = leg.dest;
        bus.dest = null;
        if (leg.alightAll) bus.load = 0;
        bus.legs.shift();
      }
    }
  }
  if (bus.legs.length === 0 && bus.state === 'idle') bus.trip = null;
}

function addArrivals(sim, dt) {
  for (const q of Object.values(sim.queues)) {
    const L = sim.lines[q.lineId];
    const remaining = L.deps.some((d) => !d.served && d.dir === q.dir && !d.extra);
    if (!remaining) continue;
    const share = q.dir === 'out' ? 1 / L.cfg.pickups.length : 1;
    q.acc += (demandPerMinute({ demand: L.peak[q.dir] }, q.dir, sim.clock) / 60) * share * dt * (0.5 + sim.rng());
    const n = Math.floor(q.acc);
    q.acc -= n;
    q.queue += n;
  }
}

export function stepSim(sim, dtSec) {
  if (!sim.running) return;
  const dt = Math.min(dtSec, SERVICE_END - sim.clock);
  if (dt > 0) {
    addArrivals(sim, dt);
    for (const id of sim.order) dispatchLine(sim, sim.lines[id]);
    for (const bus of sim.buses) stepBus(sim, bus, dt);
    sim.clock += dt;
  }
  if (sim.clock >= SERVICE_END) sim.running = false;
}

function lineOfStop(sim, stopId) {
  return Object.values(sim.lines).find((L) => L.cfg.pickups.includes(stopId));
}

// Bus currently serving (or about to serve) the next trip from `stop` in `dir`.
function nextBusEta(sim, L, stop) {
  let best = Infinity;
  for (const b of sim.buses) {
    if (b.line !== L.cfg.id || !b.trip) continue;
    const pending = b.legs.findIndex((l) => l.type === 'dwell' && l.stop === stop);
    if (pending === -1) continue;
    if (b.state === 'dwelling' && b.at === stop) return 0;
    if (pending <= 1 && b.state === 'driving') best = Math.min(best, etaSeconds(b, travelFactor(sim.clock)));
  }
  return best;
}

function screenFor(sim, L, stop, dir, qKey) {
  const inLine = sim.queues[qKey].queue;
  const now = sim.clock;
  const alertObj = [...sim.alerts].reverse().find((a) => a.lineId === L.cfg.id && a.stopId === stop && now - a.t <= ALERT_TTL_SEC);
  const offset = dir === 'out' ? pickupOffsetSec(L.cfg, stop) : 0;
  const next = L.deps.find((d) => !d.served && d.dir === dir && !d.extra);
  const eta = nextBusEta(sim, L, stop);
  const ongoing = eta !== Infinity;
  if (!sim.running || (!next && !ongoing)) {
    return { lineId: L.cfg.id, nextTime: null, nextBusMin: null, inLine, status: 'Offline', alert: null, limited: false };
  }
  const nextTime = next ? next.t + offset : null;
  const nextBusMin = ongoing ? Math.ceil(eta / 60) : Math.max(0, Math.ceil((nextTime - now) / 60));
  return {
    lineId: L.cfg.id,
    nextTime,
    nextBusMin,
    late: !ongoing && nextTime !== null && nextTime < now,
    inLine,
    status: ongoing ? 'Ongoing' : 'Waiting',
    alert: alertObj ? alertObj.text : null,
    limited: !!next?.limited,
  };
}

// The screen at a pickup stop (trips towards APU).
export function stopScreen(sim, stopId) {
  const L = lineOfStop(sim, stopId);
  return screenFor(sim, L, stopId, 'out', stopId);
}

// APU's departure board: next trip home for every route.
export function departuresBoard(sim) {
  return sim.order.map((id) => screenFor(sim, sim.lines[id], 'apu', 'back', backKey(id)));
}
