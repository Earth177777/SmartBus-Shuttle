// Timetable-driven simulation of APU Campus Connect.
// Buses run APU's published trips; empty buses reposition ("deadhead") for their next
// trip; a spare bus is called when a line overflows; traffic stretches travel times.
import { createBus, startTrip, advanceBus, etaSeconds } from './bus.js';
import { makePolyline } from './polyline.js';
import { buildDepartures, pickupOffsetSec } from './schedule.js';
import { demandPerMinute, peakRateForTimetable } from './demand.js';
import { trafficFactor, BUS_SLOWDOWN } from './traffic.js';
import { needsExtraBus } from './rules.js';
import { corridorStops, explainReroute, detourSec, REROUTE } from './reroute.js';
import { createTelemetry, record, routeAgg, tsISO, nextId } from './telemetry.js';
import { unproject } from '../geo.js';
import { scenarioById } from './scenarios.js';

export const SERVICE_START = 6.5 * 3600; // 06:30
export const SERVICE_END = 22.5 * 3600; // 22:30
export const DWELL_SEC = 60;
export const LIMITED_SHARE = 0.5; // "** Limited space only" trips
const ALERT_TTL_SEC = 10 * 60;
const DEADHEAD_SLACK_SEC = 10 * 60; // arrive this early for a trip
const EXTRA_GAP_SEC = 10 * 60; // only call an extra bus if the next trip is further away than this
const DEFAULT_LOAD = 0.6; // share of scheduled seats a day's riders fill
const FAST_FORWARD_STEP = 10;
const QUEUE_OBS_SEC = 60; // stop cameras report the line once a minute
const GPS_SEC = 30; // bus trackers report every 30 s (pitch: "every few seconds")
export const SERVICE_DATE = '2026-11-13'; // a Friday, weekday timetable

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

// Travel-time multiplier: KL traffic profile × scenario × buses being slower than cars.
export const simTraffic = (sim, clock) => trafficFactor(clock) * (sim.scenario?.traffic(clock) ?? 1);
const travelFactor = (sim, clock) => simTraffic(sim, clock) * BUS_SLOWDOWN;
const backKey = (lineId) => `apu:${lineId}`;

// smart: which SmartShuttle features run. Off = how APU runs today (for the comparison).
export const SMART_ALL = { extraBus: true, reroute: true };
export function createSim({ lines, routes, seed = 1, startClock = SERVICE_START, serviceDate = SERVICE_DATE, scenario = 'normal', smart = SMART_ALL }) {
  const sim = {
    clock: SERVICE_START,
    running: true,
    rng: mulberry32(seed),
    lines: {},
    order: lines.map((l) => l.id),
    buses: [],
    queues: {},
    alerts: [],
    decisions: [], // newest first, for the Logic tab
    scenario: scenarioById(scenario),
    smart: { ...SMART_ALL, ...smart },
    telemetry: createTelemetry(serviceDate),
    nextQueueObs: SERVICE_START,
    nextGps: SERVICE_START,
    stats: { boarded: 0, extraBuses: 0, lateDepartures: 0, reroutes: 0, dropped: 0, leftBehind: 0, waitedOver30: 0, busKm: 0, emptySeatKm: 0 },
    stopNames: Object.fromEntries(Object.entries(routes.stops).map(([id, st]) => [id, st.name])),
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
    for (const stop of cfg.pickups) sim.queues[stop] = { queue: 0, acc: 0, arrivals: [], lineId: cfg.id, dir: 'out', stopId: stop };
    sim.queues[backKey(cfg.id)] = { queue: 0, acc: 0, arrivals: [], lineId: cfg.id, dir: 'back', stopId: 'apu' };
    for (let i = 0; i < cfg.fleet; i++) {
      const bus = createBus(`${cfg.code.split(' ')[0].replace('.', '')}${i + 1}`, cfg.id, cfg.capacity);
      bus.vehicle = cfg.vehicle;
      bus.at = cfg.pickups[0];
      bus.legs = [];
      bus.trip = null;
      bus.riders = [];
      sim.buses.push(bus);
    }
  }
  // Other routes' stops that lie on each leg of this route (for rerouting).
  const owner = {};
  for (const L of Object.values(sim.lines)) for (const st of L.cfg.pickups) owner[st] = L.cfg.id;
  for (const L of Object.values(sim.lines)) {
    const others = Object.fromEntries(
      Object.entries(routes.stops).filter(([id]) => owner[id] && owner[id] !== L.cfg.id),
    );
    const tag = (list) => list.map((e) => ({ ...e, lineId: owner[e.stopId] }));
    L.outSide = L.out.map((leg) => tag(corridorStops(leg.path, others)));
    L.backShare = L.back.map((leg) => tag(corridorStops(leg.path, others)));
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
  return legs.reduce((s, l) => s + l.path.duration, 0) * travelFactor(sim, clock) + DWELL_SEC * legs.length;
}

function tripLegs(L, dir, trip) {
  const legs = [];
  const pathLegs = legsFor(L, dir);
  const drops = pathLegs.length;
  pathLegs.forEach((leg, i) => {
    if (dir === 'out') legs.push({ type: 'dwell', stop: leg.from, board: leg.from });
    else if (i === 0) legs.push({ type: 'dwell', stop: 'apu', board: backKey(L.cfg.id) });
    else legs.push({ type: 'dwell', stop: leg.from, alightShare: 1 / (drops - i + 1) });
    legs.push({
      type: 'drive', path: leg.path, dest: leg.to, alightAll: i === drops - 1,
      ...(dir === 'out' ? { side: L.outSide[i], sideIdx: 0 } : { share: L.backShare[i], drops: [] }),
    });
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
  bus.delaySec = 0;
  bus.legs = tripLegs(L, dep.dir, dep);
  openTripDoc(sim, bus, L, dep);
}

function openTripDoc(sim, bus, L, dep) {
  const tel = sim.telemetry;
  const hhmm = tsISO(tel.serviceDate, dep.t).slice(11, 16).replace(':', '');
  bus.tripDoc = record(tel, 'trips', {
    trip_id: `${L.cfg.id}-${dep.dir}-${hhmm}${dep.extra ? `-x${tel.seq + 1}` : ''}`,
    route_id: L.cfg.id,
    vehicle_id: bus.id,
    scheduled_departure_ts: tsISO(tel.serviceDate, dep.t),
    actual_departure_ts: null,
    actual_arrival_ts: null,
    service_date: tel.serviceDate,
  });
  const agg = routeAgg(tel, L.cfg.id);
  agg.trips++;
  agg.seatsOffered += bus.capacity;
  if (!dep.extra && dep.lateSec > 120) agg.late++;
  if (dep.extra) tel.seq++;
}

// Move n riders from a queue onto a bus, writing a ride_event (with real wait) for each.
function takeRiders(sim, bus, qKey, n) {
  const q = sim.queues[qKey];
  const k = Math.max(0, Math.min(n, q.queue, bus.capacity - bus.load));
  const tel = sim.telemetry;
  for (let i = 0; i < k; i++) {
    const checkIn = q.arrivals.length ? q.arrivals.shift() : sim.clock;
    const wait = sim.clock - checkIn;
    tel.agg.waitSum += wait;
    tel.agg.waitN++;
    tel.agg.waitMax = Math.max(tel.agg.waitMax, wait);
    if (wait > 30 * 60) sim.stats.waitedOver30++;
    bus.riders.push(record(tel, 'ride_events', {
      ride_id: nextId(tel, 'ride'),
      anonymous_student_id: nextId(tel, 'anon'),
      route_id: bus.line,
      stop_id: q.stopId,
      trip_id: bus.tripDoc?.trip_id ?? null,
      check_in_ts: tsISO(tel.serviceDate, checkIn),
      boarding_ts: tsISO(tel.serviceDate, sim.clock),
      alighting_ts: null,
      seats_available: bus.capacity - bus.load - i - 1,
      service_date: tel.serviceDate,
    }));
  }
  q.queue -= k;
  if (q.flagged) q.flagged = Math.max(0, Math.min(q.flagged, q.queue));
  bus.load += k;
  sim.stats.boarded += k;
  routeAgg(tel, bus.line).boarded += k;
  tel.agg.hourly[Math.floor(sim.clock / 3600) % 24] += k;
  return k;
}

// n riders get off (the earliest boarders first, or the latest for shared drop-offs).
function alight(sim, bus, n, { latest = false } = {}) {
  const k = Math.min(n, bus.load);
  const off = latest ? bus.riders.splice(Math.max(0, bus.riders.length - k), k) : bus.riders.splice(0, k);
  const ts = tsISO(sim.telemetry.serviceDate, sim.clock);
  for (const r of off) r.alighting_ts = ts;
  sim.telemetry.agg.alighted += k;
  bus.load -= k;
  return k;
}

// Seats arriving at `stop` (a pickup of line L2) within the window, in `dir`.
function seatsComing(sim, L2, stop, dir) {
  const now = sim.clock;
  const origin = originOf(L2, dir);
  const scheduled = L2.deps.filter((d) => !d.served && d.dir === dir && d.t <= now + REROUTE.NEXT_BUS_WINDOW_SEC).length;
  let seats = scheduled * L2.cfg.capacity;
  for (const b of sim.buses) {
    if (b.line !== L2.cfg.id || !b.trip || b.trip.dir !== dir) continue;
    const pendingHere = b.legs.some((l) => l.type === 'dwell' && l.stop === (dir === 'out' ? stop : origin));
    if (pendingHere || (b.state === 'dwelling' && b.at === (dir === 'out' ? stop : origin))) seats += b.capacity - b.load;
  }
  return seats;
}

const MAX_DECISIONS = 30;
function logDecision(sim, d) {
  sim.decisions.unshift({ t: sim.clock, ...d });
  if (sim.decisions.length > MAX_DECISIONS) sim.decisions.pop();
}

function rerouteAlert(sim, stopId, lineId, text) {
  sim.alerts.push({ t: sim.clock, stopId, lineId, text });
  if (sim.alerts.length > 30) sim.alerts.shift();
}

// On a trip to APU: a crowded stop of another route on this road → pull in and pick up.
function considerPickup(sim, bus, entry) {
  const L2 = sim.lines[entry.lineId];
  if (!L2) return false;
  const queue = sim.queues[entry.stopId].queue;
  const coming = seatsComing(sim, L2, entry.stopId, 'out');
  const excess = queue - coming;
  const freeSeats = bus.capacity - bus.load;
  const detour = detourSec(entry.off, travelFactor(sim, sim.clock));
  const delaySec = (bus.trip?.lateSec ?? 0) + (bus.delaySec ?? 0);
  const verdict = explainReroute({ excess, freeSeats, detourSec: detour, delaySec });
  // Only log stops where someone is actually waiting; empty stops are not decisions.
  if (queue > 0) {
    logDecision(sim, {
      kind: 'pickup', busId: bus.id, lineId: L2.cfg.id, stopId: entry.stopId, ok: verdict.ok, checks: verdict.checks,
      inputs: { queue, seatsComing: coming, excess, freeSeats, detourSec: Math.round(detour), delaySec: Math.round(delaySec), offM: Math.round(entry.off), traffic: +travelFactor(sim, sim.clock).toFixed(2) },
    });
  }
  if (!verdict.ok) return false;
  const n = Math.min(freeSeats, excess);
  bus.detour = { stopId: entry.stopId, left: detour, kind: 'pickup', n };
  bus.delaySec = (bus.delaySec ?? 0) + detour;
  sim.stats.reroutes++;
  const name = sim.stopNames[entry.stopId];
  rerouteAlert(sim, entry.stopId, L2.cfg.id, `${bus.id} (${sim.lines[bus.line].cfg.code}) stopping to pick up ${n} — ${name} is crowded`);
  return true;
}

// Leaving APU: take riders from another route's long line whose stop is on this road.
function shareAtApu(sim, bus) {
  for (const leg of bus.legs) {
    if (leg.type !== 'drive' || !leg.share) continue;
    for (const entry of leg.share) {
      const L2 = sim.lines[entry.lineId];
      if (!L2) continue;
      const q = sim.queues[backKey(L2.cfg.id)];
      const coming = seatsComing(sim, L2, 'apu', 'back');
      const excess = q.queue - coming;
      const freeSeats = bus.capacity - bus.load;
      const detour = detourSec(entry.off, travelFactor(sim, sim.clock));
      const delaySec = (bus.trip?.lateSec ?? 0) + (bus.delaySec ?? 0);
      const verdict = explainReroute({ excess, freeSeats, detourSec: detour, delaySec });
      if (q.queue > 0) {
        logDecision(sim, {
          kind: 'share', busId: bus.id, lineId: L2.cfg.id, stopId: entry.stopId, ok: verdict.ok, checks: verdict.checks,
          inputs: { queue: q.queue, seatsComing: coming, excess, freeSeats, detourSec: Math.round(detour), delaySec: Math.round(delaySec), offM: Math.round(entry.off), traffic: +travelFactor(sim, sim.clock).toFixed(2) },
        });
      }
      if (!verdict.ok) continue;
      const n = takeRiders(sim, bus, backKey(L2.cfg.id), Math.min(freeSeats, excess));
      leg.drops.push({ stopId: entry.stopId, d: entry.d, off: entry.off, n });
      bus.delaySec = (bus.delaySec ?? 0) + detour;
      sim.stats.reroutes++;
      rerouteAlert(sim, 'apu', L2.cfg.id, `${bus.id} (${sim.lines[bus.line].cfg.code}) takes ${n} riders for ${sim.stopNames[entry.stopId]} — passes on its way`);
    }
  }
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
  if (!sim.smart.extraBus) return;
  if (buses.some((b) => b.trip?.extra)) return;
  for (const dir of ['out', 'back']) {
    const origin = originOf(L, dir);
    const qKey = dir === 'out' ? origin : backKey(L.cfg.id);
    const next = L.deps.find((d) => !d.served && d.dir === dir);
    const gap = next ? next.t - now : Infinity;
    const queue = sim.queues[qKey].queue;
    if (!needsExtraBus(queue, L.cfg.capacity, false)) continue;
    const extraInputs = { queue, capacity: L.cfg.capacity, gapMin: gap === Infinity ? null : Math.round(gap / 60), minGapMin: EXTRA_GAP_SEC / 60 };
    const stopForLog = dir === 'out' ? origin : 'apu';
    if (gap <= EXTRA_GAP_SEC) {
      if (sim.lastExtraLog?.[qKey] !== next?.t) {
        (sim.lastExtraLog ??= {})[qKey] = next?.t;
        logDecision(sim, { kind: 'extra', lineId: L.cfg.id, stopId: stopForLog, ok: false, reason: `next scheduled trip is only ${extraInputs.gapMin} min away`, inputs: extraInputs });
      }
      continue;
    }
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
    if (!bus) {
      if (sim.lastExtraLog?.[qKey] !== 'nobus') {
        (sim.lastExtraLog ??= {})[qKey] = 'nobus';
        logDecision(sim, { kind: 'extra', lineId: L.cfg.id, stopId: stopForLog, ok: false, reason: 'no spare bus free (all needed for scheduled trips)', inputs: extraInputs });
      }
      continue;
    }
    if (sim.lastExtraLog) delete sim.lastExtraLog[qKey];
    logDecision(sim, { kind: 'extra', lineId: L.cfg.id, stopId: stopForLog, busId: bus.id, ok: true, reason: arriveSec > 0 ? `spare ${bus.id} drives over first` : `spare ${bus.id} is already there`, inputs: { ...extraInputs, arriveMin: Math.ceil(arriveSec / 60) } });
    const dep = { t: now, dir, limited: false, continuous: false, extra: true, served: false };
    L.deps.push(dep);
    if (arriveSec > 0) {
      bus.legs = [...deadheadLegs(L, otherStop), ...tripLegs(L, dir, dep)];
      bus.legs.trip = dep;
      bus.trip = dep;
      dep.served = true;
      dep.lateSec = 0;
      bus.delaySec = 0;
      openTripDoc(sim, bus, L, dep);
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
  const seats = bus.trip?.limited ? Math.floor(bus.capacity * LIMITED_SHARE) : bus.capacity;
  const k = takeRiders(sim, bus, qKey, Math.max(0, seats - bus.load));
  // Whoever is still in line when a full bus pulls away was left behind (counted once each).
  sim.stats.leftBehind += newlyLeftBehind(sim.queues[qKey], k);
}

// q.flagged = people at the front of the line already counted as left behind.
// After a bus took `boarded` from the front, count only those not counted before.
export function newlyLeftBehind(q, boarded) {
  const stillFlagged = Math.max(0, (q.flagged ?? 0) - boarded);
  const fresh = Math.max(0, q.queue - stillFlagged);
  q.flagged = q.queue;
  return fresh;
}

function stepBus(sim, bus, dt) {
  const factor = travelFactor(sim, sim.clock);
  for (let guard = 0; guard < 24 && dt > 1e-9 && bus.legs.length; guard++) {
    if (bus.detour) {
      const take = Math.min(dt, bus.detour.left);
      bus.detour.left -= take;
      dt -= take;
      if (bus.detour.left <= 1e-9) {
        const { kind, stopId, n } = bus.detour;
        if (kind === 'pickup') takeRiders(sim, bus, stopId, n);
        else sim.stats.dropped += alight(sim, bus, n, { latest: true });
        bus.detour = null;
      }
      continue;
    }
    const leg = bus.legs[0];
    if (leg.type === 'dwell') {
      if (bus.state !== 'dwelling') {
        bus.state = 'dwelling';
        bus.dwellLeft = DWELL_SEC;
        bus.at = leg.stop;
        if (leg.alightShare) alight(sim, bus, Math.round(bus.load * leg.alightShare));
      }
      const take = Math.min(dt, bus.dwellLeft);
      bus.dwellLeft -= take;
      dt -= take;
      if (bus.dwellLeft <= 1e-9) {
        if (leg.board) board(sim, bus, leg.board);
        bus.state = 'idle';
        bus.legs.shift();
        if (leg.stop === 'apu' && bus.trip?.dir === 'back' && sim.smart.reroute) shareAtApu(sim, bus);
      }
    } else {
      if (bus.state !== 'driving') {
        startTrip(bus, leg.path, leg.dest);
        bus.at = null;
        const km = leg.path.length / 1000;
        sim.stats.busKm += km;
        if (bus.trip) sim.stats.emptySeatKm += (bus.capacity - bus.load) * km;
        // First passenger leg (deadhead legs carry neither side nor share) = actual departure.
        if (bus.tripDoc && !bus.tripDoc.actual_departure_ts && (leg.side || leg.share)) {
          bus.tripDoc.actual_departure_ts = tsISO(sim.telemetry.serviceDate, sim.clock);
        }
      }
      const take = Math.min(dt, (bus.path.duration - bus.tt) * factor);
      dt -= take;
      advanceBus(bus, take, factor);
      if (bus.trip && leg.side && sim.smart.reroute) {
        while (leg.sideIdx < leg.side.length && leg.side[leg.sideIdx].d <= bus.d) {
          const started = considerPickup(sim, bus, leg.side[leg.sideIdx++]);
          if (started) break;
        }
      }
      if (leg.drops?.length) {
        const i = leg.drops.findIndex((x) => x.d <= bus.d);
        if (i !== -1) {
          const x = leg.drops.splice(i, 1)[0];
          bus.detour = { stopId: x.stopId, left: detourSec(x.off, factor), kind: 'drop', n: x.n };
        }
      }
      if (bus.detour) {
        // A detour right at the end of the leg: stay "driving" so the arrival is handled after it.
        if (bus.tt >= bus.path.duration) bus.state = 'driving';
        continue;
      }
      if (bus.tt >= bus.path.duration) {
        bus.state = 'idle';
        bus.at = leg.dest;
        bus.dest = null;
        if (leg.alightAll) alight(sim, bus, bus.load);
        bus.legs.shift();
      }
    }
  }
  if (bus.legs.length === 0 && bus.state === 'idle') {
    if (bus.trip && bus.tripDoc && !bus.tripDoc.actual_arrival_ts) bus.tripDoc.actual_arrival_ts = tsISO(sim.telemetry.serviceDate, sim.clock);
    bus.trip = null;
    bus.tripDoc = null;
  }
}

// Students don't wait hours: demand builds up "at home" (latent) and they walk to the
// stop in the ARRIVE_WINDOW_SEC before their next trip, spread over that window.
const ARRIVE_WINDOW_SEC = 20 * 60;
function addArrivals(sim, dt) {
  for (const q of Object.values(sim.queues)) {
    const L = sim.lines[q.lineId];
    const next = L.deps.find((d) => !d.served && d.dir === q.dir && !d.extra);
    if (!next) {
      q.latent = 0;
      continue;
    }
    const share = q.dir === 'out' ? 1 / L.cfg.pickups.length : 1;
    const scen = sim.scenario.demand(L.cfg.id, q.dir, sim.clock);
    q.latent = (q.latent ?? 0) + (demandPerMinute({ demand: L.peak[q.dir] }, q.dir, sim.clock) / 60) * scen * share * dt * (0.5 + sim.rng());
    const depAt = next.t + (q.dir === 'out' ? pickupOffsetSec(L.cfg, q.stopId) : 0);
    const timeLeft = depAt - sim.clock;
    if (timeLeft > ARRIVE_WINDOW_SEC) continue;
    // Release the pool evenly over the time left (all of it once the bus is due).
    const release = timeLeft <= dt ? q.latent : q.latent * (dt / timeLeft);
    q.latent -= release;
    q.acc += release;
    const n = Math.floor(q.acc);
    q.acc -= n;
    q.queue += n;
    for (let i = 0; i < n; i++) q.arrivals.push(sim.clock);
  }
}

// Stop cameras and bus trackers report on their own clocks.
function observe(sim) {
  const tel = sim.telemetry;
  while (sim.nextQueueObs <= sim.clock) {
    const t = sim.nextQueueObs;
    for (const [key, q] of Object.entries(sim.queues)) {
      record(tel, 'queue_events', {
        event_id: nextId(tel, 'q'),
        stop_id: q.stopId,
        route_id: q.lineId,
        observed_at: tsISO(tel.serviceDate, t),
        queue_count: q.queue,
        source: 'stop_box_sim',
        ingested_at: tsISO(tel.serviceDate, t + 2),
      });
    }
    for (const q of Object.values(sim.queues)) {
      const m = (tel.agg.maxQueue ??= {});
      m[q.stopId] = Math.max(m[q.stopId] ?? 0, q.queue);
    }
    // Analytics: buses on a trip right now, per route and network-wide (peak deployment).
    tel.agg.peakNetwork = Math.max(tel.agg.peakNetwork ?? 0, sim.buses.filter((b) => b.trip).length);
    const active = {};
    for (const b of sim.buses) if (b.trip) active[b.line] = (active[b.line] ?? 0) + 1;
    for (const [id, n] of Object.entries(active)) {
      const agg = routeAgg(tel, id);
      agg.peakBuses = Math.max(agg.peakBuses, n);
    }
    sim.nextQueueObs += QUEUE_OBS_SEC;
  }
  while (sim.nextGps <= sim.clock) {
    const t = sim.nextGps;
    for (const b of sim.buses) {
      if (b.state !== 'driving' || !b.path) continue;
      const p = b.path.pointAt(b.d);
      const { lat, lon } = unproject(p.x, p.z);
      record(tel, 'gps_events', {
        vehicle_id: b.id,
        route_id: b.line,
        recorded_at: tsISO(tel.serviceDate, t),
        latitude: +lat.toFixed(6),
        longitude: +lon.toFixed(6),
        speed_kmh: +((b.path.length / Math.max(b.path.duration, 1)) * 3.6 / travelFactor(sim, t)).toFixed(1),
        trip_id: b.tripDoc?.trip_id ?? null,
      });
    }
    sim.nextGps += GPS_SEC;
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
    observe(sim);
  }
  if (sim.clock >= SERVICE_END) sim.running = false;
}

function lineOfStop(sim, stopId) {
  return Object.values(sim.lines).find((L) => L.cfg.pickups.includes(stopId));
}

// Bus currently serving (or about to serve) the next trip from `stop` in `dir`.
function nextBusEta(sim, L, stop) {
  let best = Infinity;
  // Another route's bus rerouted to this stop counts too.
  for (const b of sim.buses) {
    if (b.detour?.kind === 'pickup' && b.detour.stopId === stop) best = Math.min(best, b.detour.left);
  }
  for (const b of sim.buses) {
    if (b.line !== L.cfg.id || !b.trip) continue;
    const pending = b.legs.findIndex((l) => l.type === 'dwell' && l.stop === stop);
    if (pending === -1) continue;
    if (b.state === 'dwelling' && b.at === stop) return 0;
    if (pending <= 1 && b.state === 'driving') best = Math.min(best, etaSeconds(b, travelFactor(sim, sim.clock)));
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

// Set how many people wait at a stop ('lrt') or in an APU line ('apu:lrt'). 0–999 people.
export function setQueue(sim, key, n) {
  const q = sim.queues[key];
  if (!q || !Number.isFinite(n)) return false;
  q.queue = Math.min(999, Math.max(0, Math.round(n)));
  // New people check in now; removed people leave from the back of the line.
  while (q.arrivals.length < q.queue) q.arrivals.push(sim.clock);
  q.arrivals.length = q.queue;
  return true;
}
