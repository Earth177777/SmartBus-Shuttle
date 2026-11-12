import { describe, it, expect } from 'vitest';
import { countPeople, smoothCount } from '../src/sim/camera-count.js';
import { buildSnapshot } from '../src/live/snapshot.js';
import { createSim, stepSim } from '../src/sim/sim.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

const h = (x) => Math.round(x * 3600);

describe('camera stop box', () => {
  it('counts confident person detections only', () => {
    const preds = [
      { class: 'person', score: 0.9 },
      { class: 'person', score: 0.4 },
      { class: 'chair', score: 0.95 },
      { class: 'person', score: 0.61 },
    ];
    expect(countPeople(preds, 0.5)).toBe(2);
  });
  it('smooths flicker with the median of recent counts', () => {
    expect(smoothCount([3, 3, 9, 3, 2])).toBe(3);
    expect(smoothCount([])).toBe(0);
  });
});

describe('live snapshot (phone card + Firebase)', () => {
  it('summarises every stop and the APU board in plain JSON', () => {
    const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(8) });
    const snap = buildSnapshot(sim, LINES, routes.stops);
    expect(snap.clock).toBe(sim.clock);
    expect(snap.stops.lrt).toMatchObject({ name: 'LRT Bukit Jalil', code: 'LRT', inLine: sim.queues.lrt.queue });
    expect(['Ongoing', 'Waiting', 'Offline']).toContain(snap.stops.lrt.status);
    expect(snap.board).toHaveLength(LINES.length);
    expect(() => JSON.stringify(snap)).not.toThrow();
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });
});
