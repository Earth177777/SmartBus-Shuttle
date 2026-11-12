import { describe, it, expect } from 'vitest';
import { explainReroute, REROUTE } from '../src/sim/reroute.js';
import { createSim, stepSim } from '../src/sim/sim.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

const h = (x) => Math.round(x * 3600);

describe('explainReroute', () => {
  it('lists each condition with its value, limit and pass/fail', () => {
    const r = explainReroute({ excess: 20, freeSeats: 2, detourSec: 120, delaySec: 0 });
    expect(r.ok).toBe(false);
    expect(r.checks.map((c) => c.label)).toEqual(['Excess people', 'Free seats', 'Detour', 'Delay + detour']);
    const seats = r.checks.find((c) => c.label === 'Free seats');
    expect(seats).toMatchObject({ value: 2, limit: REROUTE.MIN_FREE_SEATS, op: '≥', pass: false });
    expect(r.checks.filter((c) => !c.pass)).toHaveLength(1);
  });
  it('is ok exactly when shouldReroute is', () => {
    expect(explainReroute({ excess: 20, freeSeats: 15, detourSec: 120, delaySec: 0 }).ok).toBe(true);
  });
});

describe('decision log', () => {
  it('records reroute checks with their numbers, newest first', () => {
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(13 + 20 / 60) });
    sim.queues.maple.queue = 30;
    for (let t = 0; t < 40 * 60; t += 5) stepSim(sim, 5);
    const d = sim.decisions.find((x) => x.kind === 'pickup' && x.ok);
    expect(d).toBeTruthy();
    expect(d).toMatchObject({ stopId: 'maple' });
    expect(d.inputs.queue).toBeGreaterThan(0);
    expect(d.inputs.excess).toBe(d.inputs.queue - d.inputs.seatsComing);
    expect(d.checks.every((c) => c.pass)).toBe(true);
    expect(sim.decisions.length).toBeLessThanOrEqual(30);
    for (let i = 1; i < sim.decisions.length; i++) expect(sim.decisions[i - 1].t).toBeGreaterThanOrEqual(sim.decisions[i].t);
  });
  it('records extra-bus calls with queue, seats and gap to the next trip', () => {
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(11.75) });
    sim.queues.lrt.queue = 200;
    for (let t = 0; t < 6 * 60; t += 1) stepSim(sim, 1);
    const extras = sim.decisions.filter((x) => x.kind === 'extra' && x.lineId === 'lrt');
    const called = extras.find((x) => x.ok);
    expect(called).toMatchObject({ stopId: 'lrt' });
    expect(called.inputs.queue).toBeGreaterThanOrEqual(200);
    expect(called.inputs.capacity).toBe(40);
    expect(called.inputs.gapMin).toBeGreaterThan(10);
    // Before a spare was free, the refusal says why.
    expect(extras.some((x) => !x.ok && /no spare bus/.test(x.reason))).toBe(true);
  });
});
