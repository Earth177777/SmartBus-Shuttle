import { describe, it, expect } from 'vitest';
import { setQueue, createSim } from '../src/sim/sim.js';
import { parseTimetableText, applyOverrides } from '../src/sim/overrides.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

describe('setQueue', () => {
  const sim = createSim({ lines: LINES, routes, seed: 1 });
  it('sets how many people wait at a stop or in an APU line', () => {
    expect(setQueue(sim, 'lrt', 25)).toBe(true);
    expect(sim.queues.lrt.queue).toBe(25);
    expect(setQueue(sim, 'apu:parkhill', 12)).toBe(true);
    expect(sim.queues['apu:parkhill'].queue).toBe(12);
  });
  it('clamps to 0–999 whole people and rejects junk', () => {
    setQueue(sim, 'lrt', -4);
    expect(sim.queues.lrt.queue).toBe(0);
    setQueue(sim, 'lrt', 5000);
    expect(sim.queues.lrt.queue).toBe(999);
    setQueue(sim, 'lrt', 7.6);
    expect(sim.queues.lrt.queue).toBe(8);
    expect(setQueue(sim, 'lrt', NaN)).toBe(false);
    expect(setQueue(sim, 'nowhere', 3)).toBe(false);
  });
});

describe('parseTimetableText', () => {
  it('reads times separated by commas, spaces or new lines, sorted and de-duplicated', () => {
    expect(parseTimetableText('9:00, 07:30\n7:30 **21:45')).toEqual({ times: ['07:30', '09:00', '**21:45'], errors: [] });
  });
  it('reports what it cannot read', () => {
    const r = parseTimetableText('7:30, 25:00, lunch, 9:61');
    expect(r.times).toEqual(['07:30']);
    expect(r.errors).toEqual(['25:00', 'lunch', '9:61']);
  });
});

describe('applyOverrides', () => {
  it('changes times, fleet and seats of one route and leaves the rest', () => {
    const lines = applyOverrides(LINES, { parkhill: { out: ['08:00'], back: ['17:00'], fleet: 2, capacity: 30 } });
    const ph = lines.find((l) => l.id === 'parkhill');
    expect(ph).toMatchObject({ out: ['08:00'], back: ['17:00'], fleet: 2, capacity: 30 });
    expect(lines.find((l) => l.id === 'lrt')).toBe(LINES.find((l) => l.id === 'lrt'));
  });
  it('switches a route off', () => {
    const lines = applyOverrides(LINES, { maple: { enabled: false } });
    expect(lines.some((l) => l.id === 'maple')).toBe(false);
    expect(lines).toHaveLength(LINES.length - 1);
  });
  it('a simulation runs the edited timetable', () => {
    const lines = applyOverrides(LINES, { parkhill: { out: ['08:00'], back: ['17:00'] } });
    const sim = createSim({ lines, routes, seed: 1 });
    expect(sim.lines.parkhill.deps.map((d) => d.t)).toEqual([8 * 3600, 17 * 3600]);
  });
  it('a simulation without a switched-off route still runs and reroutes nothing to it', () => {
    const lines = applyOverrides(LINES, { maple: { enabled: false } });
    const sim = createSim({ lines, routes, seed: 1, startClock: 9 * 3600 });
    expect(sim.lines.maple).toBeUndefined();
    expect(sim.queues.maple).toBeUndefined();
  });
});
