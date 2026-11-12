import { describe, it, expect } from 'vitest';
import { evaluateFleet, optimizeFleet, OPT } from '../src/sim/optimize.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

const line = (id) => LINES.find((l) => l.id === id);

describe('evaluateFleet', () => {
  it('replays a route\'s day with a given fleet and reports service quality', () => {
    const r = evaluateFleet(line('bloomsvale'), routes, 1);
    expect(r).toMatchObject({ lineId: 'bloomsvale', fleet: 1 });
    expect(r.trips).toBe(line('bloomsvale').out.length + line('bloomsvale').back.length);
    expect(r.latePct).toBeGreaterThan(OPT.MAX_LATE_PCT); // one van can't make 30-min turnarounds
    const two = evaluateFleet(line('bloomsvale'), routes, 2);
    expect(two.latePct).toBeLessThanOrEqual(OPT.MAX_LATE_PCT);
    expect(two.unserved).toBe(0);
  });
});

describe('optimizeFleet', () => {
  const lines = LINES.filter((l) => ['parkhill', 'bloomsvale', 'lrt'].includes(l.id));

  it('picks the smallest fleet per route that keeps trips on time', () => {
    const res = optimizeFleet(lines, routes);
    const by = Object.fromEntries(res.routes.map((r) => [r.lineId, r]));
    expect(by.bloomsvale.recommended).toBe(2);
    expect(by.parkhill.recommended).toBe(1);
    expect(by.lrt.recommended).toBeGreaterThanOrEqual(2);
    for (const r of res.routes) expect(r.result.latePct).toBeLessThanOrEqual(OPT.MAX_LATE_PCT);
    expect(res.total).toBe(res.routes.reduce((n, r) => n + r.recommended, 0));
    expect(res.capped).toBe(false);
  });

  it('fits under a max-bus cap by trimming the routes that lose least', () => {
    const free = optimizeFleet(lines, routes);
    const cap = free.total - 1;
    const res = optimizeFleet(lines, routes, { maxBuses: cap });
    expect(res.total).toBeLessThanOrEqual(cap);
    expect(res.capped).toBe(true);
    for (const r of res.routes) expect(r.recommended).toBeGreaterThanOrEqual(1);
  });

  it('never goes below one bus per route even if the cap is tiny', () => {
    const res = optimizeFleet(lines, routes, { maxBuses: 1 });
    expect(res.routes.every((r) => r.recommended === 1)).toBe(true);
    expect(res.total).toBe(lines.length);
    expect(res.infeasible).toBe(true);
  });
});
