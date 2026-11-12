import { describe, it, expect } from 'vitest';
import { SCENARIOS, scenarioById } from '../src/sim/scenarios.js';
import { createSim, stepSim, estimateTripSec } from '../src/sim/sim.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

const h = (x) => Math.round(x * 3600);
const day = (scenario, seed = 1) => {
  const sim = createSim({ lines: LINES, routes, seed, scenario });
  while (sim.running) stepSim(sim, 15);
  return sim;
};

describe('scenarios', () => {
  it('offers the one-click scenarios', () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(['normal', 'exam', 'rain', 'stadium', 'lrt_delay']);
    for (const s of SCENARIOS) expect(s.name && s.description).toBeTruthy();
  });
  it('normal changes nothing', () => {
    const n = scenarioById('normal');
    expect(n.traffic(h(8))).toBe(1);
    expect(n.demand('lrt', 'out', h(8))).toBe(1);
  });
  it('rain slows traffic and brings more riders', () => {
    const r = scenarioById('rain');
    expect(r.traffic(h(8))).toBeGreaterThan(1.2);
    expect(r.demand('parkhill', 'out', h(8))).toBeGreaterThan(1);
  });
  it('a stadium event jams the evening around the LRT', () => {
    const s = scenarioById('stadium');
    expect(s.traffic(h(18.5))).toBeGreaterThan(1.3);
    expect(s.traffic(h(10))).toBe(1);
    expect(s.demand('lrt', 'back', h(18))).toBeGreaterThan(1.3);
  });
  it('a rainy morning makes the same trip take longer', () => {
    const normal = createSim({ lines: LINES, routes, seed: 1 });
    const rain = createSim({ lines: LINES, routes, seed: 1, scenario: 'rain' });
    expect(estimateTripSec(rain, 'lrt', 'out', h(8))).toBeGreaterThan(estimateTripSec(normal, 'lrt', 'out', h(8)));
  });
  it('an LRT delay floods the LRT stop and SmartShuttle calls more extra buses', () => {
    const extras = (sim) => sim.lines.lrt.deps.filter((d) => d.extra).length;
    expect(extras(day('lrt_delay'))).toBeGreaterThan(extras(day('normal')));
  });
});
