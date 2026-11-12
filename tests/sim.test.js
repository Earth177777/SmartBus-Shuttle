import { describe, it, expect } from 'vitest';
import {
  createSim, stepSim, stopScreen, departuresBoard, estimateTripSec,
  SERVICE_START, SERVICE_END,
} from '../src/sim/sim.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';
import { parseTime } from '../src/sim/schedule.js';

const h = (hours) => Math.round(hours * 3600);
const make = (opts = {}) => createSim({ lines: LINES, routes, seed: 1, ...opts });
const runTo = (sim, clock, dt = 10) => { while (sim.clock < clock && sim.running) stepSim(sim, Math.min(dt, clock - sim.clock)); };

describe('timetable-driven simulation', () => {
  it('starts at 06:30 with every route\'s fleet parked at its first pickup', () => {
    const sim = make();
    expect(sim.clock).toBe(SERVICE_START);
    expect(SERVICE_START).toBe(h(6.5));
    expect(SERVICE_END).toBe(h(22.5));
    const total = LINES.reduce((n, l) => n + l.fleet, 0);
    expect(sim.buses).toHaveLength(total);
    for (const bus of sim.buses) {
      const line = LINES.find((l) => l.id === bus.line);
      expect(bus.at).toBe(line.pickups[0]);
    }
  });

  it('runs the 07:30 LRT→APU trip', () => {
    const sim = make();
    runTo(sim, h(7.5) + 120);
    const dep = sim.lines.lrt.deps.find((d) => d.dir === 'out' && d.t === parseTime('07:30').t);
    expect(dep.served).toBe(true);
  });

  it('serves every timetabled trip of the day, mostly on time', () => {
    const sim = make();
    runTo(sim, SERVICE_END);
    for (const line of LINES) {
      const deps = sim.lines[line.id].deps.filter((d) => !d.extra);
      expect(deps.every((d) => d.served), `${line.id} unserved`).toBe(true);
      const late = deps.filter((d) => d.lateSec > 10 * 60).length;
      expect(late / deps.length, `${line.id} late share`).toBeLessThanOrEqual(0.15);
    }
  });

  it('keeps queues non-negative and loads within seats', () => {
    const sim = make();
    while (sim.running) {
      stepSim(sim, 15);
      for (const q of Object.values(sim.queues)) expect(q.queue).toBeGreaterThanOrEqual(0);
      for (const b of sim.buses) expect(b.load).toBeLessThanOrEqual(b.capacity);
    }
  });

  it('is busy in the morning peak and quiet at night', () => {
    const sim = make();
    let peak = 0;
    let night = 0;
    while (sim.running) {
      stepSim(sim, 10);
      const q = sim.queues.lrt.queue;
      if (sim.clock >= h(7.5) && sim.clock < h(9)) peak = Math.max(peak, q);
      if (sim.clock >= h(20.5)) night = Math.max(night, q);
    }
    expect(peak).toBeGreaterThan(20);
    expect(night).toBeLessThan(5);
  });

  it('shows Offline once a stop has no more trips today', () => {
    const sim = make();
    runTo(sim, h(19));
    expect(stopScreen(sim, 'maple').status).toBe('Offline'); // last Maple→APU 13:10
    expect(stopScreen(sim, 'lrt').status).toBe('Offline'); // last LRT→APU 18:20
  });

  it('stop screen shows the next scheduled departure', () => {
    const sim = make();
    runTo(sim, h(12));
    const s = stopScreen(sim, 'parkhill');
    expect(s.nextTime).toBe(parseTime('13:45').t);
    expect(s.status).toBe('Waiting');
    expect(s.inLine).toBe(sim.queues.parkhill.queue);
  });

  it('APU board lists every route with its next departure home', () => {
    const sim = make();
    runTo(sim, h(16.2));
    const board = departuresBoard(sim);
    expect(board.map((r) => r.lineId)).toEqual(LINES.map((l) => l.id));
    const ph = board.find((r) => r.lineId === 'parkhill');
    expect(ph.nextTime).toBe(parseTime('16:15').t > sim.clock ? parseTime('16:15').t : parseTime('17:15').t);
  });

  it('can start at any hour', () => {
    const sim = make({ startClock: h(17) });
    expect(sim.clock).toBe(h(17));
    expect(sim.lines.lrt.deps.filter((d) => d.served).length).toBeGreaterThan(30);
  });

  it('calls one extra bus when a line overflows between trips', () => {
    const sim = make({ startClock: h(11.75) }); // next LRT→APU is 12:10
    sim.queues.lrt.queue = 200;
    let maxExtra = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepSim(sim, 1);
      maxExtra = Math.max(maxExtra, sim.buses.filter((b) => b.line === 'lrt' && b.trip?.extra).length);
    }
    expect(sim.stats.extraBuses).toBeGreaterThanOrEqual(1);
    expect(maxExtra).toBe(1);
    expect(sim.alerts.some((a) => a.stopId === 'lrt' && a.text.startsWith('Line is longer than one bus'))).toBe(true);
  });

  it('sizes demand to the timetable so quiet routes rarely need extra buses', () => {
    const sim = make();
    runTo(sim, SERVICE_END);
    const extras = (id) => sim.lines[id].deps.filter((d) => d.extra).length;
    for (const id of ['kuchai_sentral', 'divo', 'maple', 'parkhill']) expect(extras(id), id).toBeLessThanOrEqual(2);
  });

  it('takes longer in rush-hour traffic', () => {
    const sim = make();
    expect(estimateTripSec(sim, 'lrt', 'out', h(8))).toBeGreaterThan(estimateTripSec(sim, 'lrt', 'out', h(11)) * 1.5);
  });

  it('is deterministic for the same seed', () => {
    const a = make({ seed: 7 });
    const b = make({ seed: 7 });
    runTo(a, h(10));
    runTo(b, h(10));
    expect(a.stats.boarded).toBe(b.stats.boarded);
  });

  it('stops at the end of service', () => {
    const sim = make({ startClock: SERVICE_END - 30 });
    runTo(sim, SERVICE_END + 60);
    expect(sim.running).toBe(false);
    expect(stopScreen(sim, 'lrt').status).toBe('Offline');
  });
});

describe('students time their arrival to the timetable', () => {
  const runDay = () => {
    const sim = createSim({ lines: LINES, routes, seed: 1 });
    let ks9 = null;
    while (sim.running) {
      stepSim(sim, 10);
      if (ks9 === null && sim.clock >= 9 * 3600) ks9 = sim.queues.kuchai_sentral.queue;
    }
    return { sim, ks9 };
  };
  const { sim, ks9 } = runDay();

  it('nobody waits at Kuchai Sentral at 9:00 when the next bus is at 10:00', () => {
    expect(ks9).toBe(0);
  });
  it('average wait over the day is short and nobody waits for hours', () => {
    const agg = sim.telemetry.agg;
    expect(agg.waitSum / agg.waitN / 60).toBeLessThan(12);
    expect(agg.waitMax / 60).toBeLessThan(90);
  });
  it('still carries about as many riders as the timetable is sized for', () => {
    expect(sim.stats.boarded).toBeGreaterThan(2500);
  });
});
