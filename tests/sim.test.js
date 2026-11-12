import { describe, it, expect } from 'vitest';
import { createSim, stepSim, stopScreen, SERVICE_START, SERVICE_END } from '../src/sim/sim.js';
import { buildRoutes } from '../src/sim/routing.js';
import area from '../src/data/area.json';

const routes = buildRoutes(area);
const run = (sim, seconds, dt = 1) => { for (let t = 0; t < seconds; t += dt) stepSim(sim, dt); };

describe('simulation', () => {
  it('starts at 07:00 with three stops and the base fleet', () => {
    const sim = createSim({ routes, seed: 1 });
    expect(sim.clock).toBe(SERVICE_START);
    expect(SERVICE_START).toBe(7 * 3600);
    expect(Object.keys(sim.stops).sort()).toEqual(['apu', 'lrt', 'parkhill']);
    expect(sim.buses.map((b) => b.id).sort()).toEqual(['L1', 'L2', 'P1']);
    expect(sim.running).toBe(true);
  });

  it('boards students in the first hour and never goes negative', () => {
    const sim = createSim({ routes, seed: 1 });
    let minQueue = 0;
    for (let t = 0; t < 3600; t++) {
      stepSim(sim, 1);
      for (const s of Object.values(sim.stops)) minQueue = Math.min(minQueue, s.queue);
    }
    expect(sim.stats.boarded).toBeGreaterThan(0);
    expect(minQueue).toBe(0);
  });

  it('caps extra buses at one per stop', () => {
    const sim = createSim({ routes, seed: 1 });
    sim.stops.lrt.queue = 200;
    let maxExtra = 0;
    for (let t = 0; t < 600; t++) {
      stepSim(sim, 1);
      maxExtra = Math.max(maxExtra, sim.buses.filter((b) => b.extra).length);
    }
    expect(maxExtra).toBe(1);
    expect(sim.alerts.some((a) => a.text.startsWith('Line is longer than one bus: 2nd bus called'))).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const a = createSim({ routes, seed: 7 });
    const b = createSim({ routes, seed: 7 });
    run(a, 3600);
    run(b, 3600);
    expect(a.stats.boarded).toBe(b.stats.boarded);
  });

  it('offline after service end', () => {
    const sim = createSim({ routes, seed: 1 });
    sim.clock = SERVICE_END - 5;
    run(sim, 10);
    expect(SERVICE_END).toBe(22 * 3600);
    expect(sim.running).toBe(false);
    expect(stopScreen(sim, 'lrt').status).toBe('Offline');
    const clock = sim.clock;
    stepSim(sim, 60);
    expect(sim.clock).toBe(clock);
  });

  it('stop screen reports line length and next bus', () => {
    const sim = createSim({ routes, seed: 1 });
    run(sim, 120);
    const s = stopScreen(sim, 'apu');
    expect(s.inLine).toBe(sim.stops.apu.queue);
    expect(['Ongoing', 'Waiting']).toContain(s.status);
    expect(s.nextBusMin === null || s.nextBusMin >= 0).toBe(true);
  });

  it('the Parkhill bus sometimes takes the smart stop at the LRT during the rush', () => {
    const sim = createSim({ routes, seed: 3 });
    run(sim, 2 * 3600, 2);
    expect(sim.stats.smartStops).toBeGreaterThan(0);
  });

  it('survives 60× speed steps (large dt)', () => {
    const sim = createSim({ routes, seed: 1 });
    run(sim, 3600, 15);
    for (const s of Object.values(sim.stops)) expect(s.queue).toBeGreaterThanOrEqual(0);
    for (const b of sim.buses) expect(b.load).toBeLessThanOrEqual(b.capacity);
  });
});
