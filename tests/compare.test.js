import { describe, it, expect } from 'vitest';
import { runDay, compareDays, TODAY, SMART } from '../src/sim/compare.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

describe('Today vs SmartShuttle', () => {
  it('today has no extra buses and no reroutes', () => {
    expect(TODAY).toEqual({ extraBus: false, reroute: false });
    expect(SMART).toEqual({ extraBus: true, reroute: true });
    const m = runDay(LINES, routes, { smart: TODAY, seed: 4 });
    expect(m.extraBuses).toBe(0);
    expect(m.reroutes).toBe(0);
  });

  it('reports the measures judges care about', () => {
    const m = runDay(LINES, routes, { smart: SMART, seed: 4 });
    for (const key of ['riders', 'avgWaitMin', 'maxWaitMin', 'waitedOver30', 'leftBehind', 'emptySeatKm', 'busKm', 'extraBuses', 'reroutes', 'lateTrips']) {
      expect(typeof m[key], key).toBe('number');
    }
    expect(m.riders).toBeGreaterThan(1000);
    expect(m.busKm).toBeGreaterThan(m.emptySeatKm / 40);
  });

  it('SmartShuttle cuts waiting and students left behind on the same day', () => {
    const c = compareDays(LINES, routes, { seed: 4 });
    expect(c.smart.avgWaitMin).toBeLessThan(c.today.avgWaitMin);
    expect(c.smart.leftBehind).toBeLessThanOrEqual(c.today.leftBehind);
    expect(c.smart.waitedOver30).toBeLessThan(c.today.waitedOver30);
    expect(c.delta.avgWaitMin).toBeCloseTo(c.smart.avgWaitMin - c.today.avgWaitMin, 6);
  });

  it('works under a scenario', () => {
    const c = compareDays(LINES, routes, { seed: 4, scenario: 'lrt_delay' });
    expect(c.scenario).toBe('lrt_delay');
    expect(c.smart.leftBehind).toBeLessThan(c.today.leftBehind);
    expect(c.smart.stranded).toBeLessThan(c.today.stranded);
  });
});

import { newlyLeftBehind } from '../src/sim/sim.js';

describe('fair measures', () => {
  it('counts each person left behind once, however many full buses pass them', () => {
    const q = { queue: 100, flagged: 0 };
    q.queue -= 40; // first bus takes 40
    expect(newlyLeftBehind(q, 40)).toBe(60);
    q.queue -= 40; // second bus takes the 40 at the front — all already counted
    expect(newlyLeftBehind(q, 40)).toBe(0);
    q.queue += 30; // 30 new people join
    q.queue -= 40; // third bus: takes the last 20 counted + 20 new; 10 new are left
    expect(newlyLeftBehind(q, 40)).toBe(10);
  });

  it('includes people who never got a bus, capped at the time they would give up', () => {
    const m = runDay(LINES, routes, { smart: TODAY, seed: 4, scenario: 'stadium' });
    expect(typeof m.stranded).toBe('number');
    expect(m.avgWaitMin).toBeGreaterThanOrEqual(m.avgWaitBoardedMin);
  });

  it('SmartShuttle is no worse on any scenario\'s average wait, counting stranded riders', () => {
    for (const scenario of ['normal', 'stadium', 'lrt_delay']) {
      const c = compareDays(LINES, routes, { seed: 4, scenario });
      expect(c.smart.avgWaitMin, scenario).toBeLessThanOrEqual(c.today.avgWaitMin);
    }
  });
});
