import { describe, it, expect } from 'vitest';
import { corridorStops, shouldReroute, detourSec, REROUTE } from '../src/sim/reroute.js';
import { makePolyline } from '../src/sim/polyline.js';
import { createSim, stepSim, stopScreen } from '../src/sim/sim.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

describe('corridorStops', () => {
  it('finds stops within the radius of a path, with distance along it', () => {
    const path = makePolyline([[0, 0], [1000, 0]]);
    const found = corridorStops(path, { a: { x: 500, z: 100 }, b: { x: 500, z: 600 } }, 300);
    expect(found).toHaveLength(1);
    expect(found[0].stopId).toBe('a');
    expect(found[0].d).toBeCloseTo(500, 6);
    expect(found[0].off).toBeCloseTo(100, 6);
  });
});

describe('shouldReroute (the formula)', () => {
  const ok = { excess: 20, freeSeats: 15, detourSec: 120, delaySec: 0 };
  it('reroutes when the stop is crowded, the bus has room, and the detour is short', () => {
    expect(shouldReroute(ok)).toBe(true);
  });
  it('skips a stop whose own buses can carry everyone', () => {
    expect(shouldReroute({ ...ok, excess: REROUTE.MIN_EXCESS - 1 })).toBe(false);
  });
  it('skips when the bus is nearly full', () => {
    expect(shouldReroute({ ...ok, freeSeats: REROUTE.MIN_FREE_SEATS - 1 })).toBe(false);
  });
  it('skips a detour that is too long', () => {
    expect(shouldReroute({ ...ok, detourSec: REROUTE.MAX_DETOUR_SEC + 1 })).toBe(false);
  });
  it('skips when the detour would break the promised arrival for riders on board', () => {
    expect(shouldReroute({ ...ok, delaySec: REROUTE.PROMISE_BUFFER_SEC - 60, detourSec: 120 })).toBe(false);
  });
});

describe('detourSec', () => {
  it('drives off and back at traffic-stretched speed, plus a boarding stop', () => {
    expect(detourSec(0, 1)).toBe(REROUTE.STOP_SEC);
    expect(detourSec(200, 2)).toBeCloseTo((2 * 200 / REROUTE.DETOUR_SPEED_MPS) * 2 + REROUTE.STOP_SEC, 6);
  });
});

describe('rerouting in the simulation', () => {
  const h = (x) => Math.round(x * 3600);
  const run = (sim, sec) => { for (let t = 0; t < sec; t += 5) stepSim(sim, 5); };

  it('a bus to APU with free seats picks up at a crowded stop on its road', () => {
    // 13:20: Maple's last trip (13:10) has gone; D'IVO 13:25 and KS 13:35 pass The Maple Residences.
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(13 + 20 / 60) });
    sim.queues.maple.queue = 30;
    run(sim, 40 * 60);
    expect(sim.stats.reroutes).toBeGreaterThanOrEqual(1);
    expect(sim.queues.maple.queue).toBeLessThan(30);
    expect(sim.alerts.some((a) => a.stopId === 'maple' && /pick up/.test(a.text))).toBe(true);
  });

  it('a bus heading home takes another route\'s riders and drops them on its way', () => {
    // 15:28: Bloomsvale/Harmony leaves APU at 15:30 past Maple; Maple's next trip home is 16:30.
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(15 + 28 / 60) });
    sim.queues['apu:maple'].queue = 20;
    run(sim, 3 * 60);
    expect(sim.queues['apu:maple'].queue).toBeLessThan(20);
    const bv = sim.buses.filter((b) => b.line === 'bloomsvale' && b.trip);
    expect(bv.some((b) => b.legs.some((l) => l.drops?.length))).toBe(true);
    run(sim, 30 * 60);
    expect(sim.stats.reroutes).toBeGreaterThanOrEqual(1);
    expect(sim.stats.dropped).toBeGreaterThan(0);
  });

  it('the stop screen shows the rerouted bus coming, even after the stop\'s own last trip', () => {
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(13 + 20 / 60) });
    sim.queues.maple.queue = 30;
    for (let i = 0; i < 600 && !sim.buses.some((b) => b.detour); i++) stepSim(sim, 5);
    const s = stopScreen(sim, 'maple');
    expect(s.status).toBe('Ongoing');
    expect(s.alert).toMatch(/pick up/);
    expect(s.nextBusMin).toBeGreaterThanOrEqual(0);
  });

  it('leaves a stop alone when its own bus is about to come', () => {
    // 10:12: Maple's own 10:20 trip is due; 10 people fit easily.
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(10.2) });
    sim.queues.maple.queue = 10;
    const before = sim.stats.reroutes;
    run(sim, 6 * 60);
    expect(sim.stats.reroutes).toBe(before);
  });
});
