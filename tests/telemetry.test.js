import { describe, it, expect } from 'vitest';
import { createSim, stepSim, setQueue } from '../src/sim/sim.js';
import { tsISO, RECENT_MAX } from '../src/sim/telemetry.js';
import { unproject, project } from '../src/geo.js';
import { LINES } from '../src/data/lines.js';
import routes from '../src/data/routes.json';

const h = (x) => Math.round(x * 3600);
const run = (sim, sec, dt = 5) => { for (let t = 0; t < sec; t += dt) stepSim(sim, dt); };

describe('tsISO', () => {
  it('formats a service-day clock as a Malaysia-time timestamp', () => {
    expect(tsISO('2026-11-13', h(7.5) + 5)).toBe('2026-11-13T07:30:05+08:00');
  });
});

describe('unproject', () => {
  it('inverts project', () => {
    const p = project(3.0583, 101.6922);
    const q = unproject(p.x, p.z);
    expect(q.lat).toBeCloseTo(3.0583, 6);
    expect(q.lon).toBeCloseTo(101.6922, 6);
  });
});

describe('Firebase-style telemetry (BigQuery schema)', () => {
  const sim = createSim({ lines: LINES, routes, seed: 1, startClock: h(8) });
  const tel = sim.telemetry;

  it('writes a queue_event per stop camera every minute', () => {
    const q = tel.recent.queue_events[0];
    expect(Object.keys(q)).toEqual(['event_id', 'stop_id', 'route_id', 'observed_at', 'queue_count', 'source', 'ingested_at']);
    expect(q.source).toBe('stop_box_sim');
    const minutes = (h(8) - h(6.5)) / 60;
    expect(tel.counts.queue_events).toBeGreaterThanOrEqual(minutes * Object.keys(sim.queues).length - Object.keys(sim.queues).length);
  });

  it('writes ride_events with anonymous ids and real wait times', () => {
    const r = tel.recent.ride_events.find((x) => x.boarding_ts);
    expect(Object.keys(r)).toEqual(['ride_id', 'anonymous_student_id', 'route_id', 'stop_id', 'trip_id', 'check_in_ts', 'boarding_ts', 'alighting_ts', 'seats_available', 'service_date']);
    expect(r.anonymous_student_id).toMatch(/^anon-/);
    expect(r.boarding_ts >= r.check_in_ts).toBe(true);
    expect(tel.agg.waitN).toBe(sim.stats.boarded);
    expect(tel.agg.waitSum / tel.agg.waitN).toBeGreaterThan(0);
  });

  it('fills alighting_ts when riders get off', () => {
    expect(tel.agg.alighted).toBeGreaterThan(0);
    const onBoard = sim.buses.reduce((n, b) => n + b.load, 0);
    expect(tel.agg.alighted + onBoard).toBe(sim.stats.boarded);
    const bus = sim.buses.find((b) => b.riders.length);
    expect(bus.riders.length).toBe(bus.load);
    expect(bus.riders.every((r) => r.alighting_ts === null)).toBe(true);
  });

  it('writes trips with scheduled and actual times', () => {
    const t = tel.recent.trips.find((x) => x.actual_arrival_ts);
    expect(Object.keys(t)).toEqual(['trip_id', 'route_id', 'vehicle_id', 'scheduled_departure_ts', 'actual_departure_ts', 'actual_arrival_ts', 'service_date']);
    expect(t.actual_departure_ts >= t.scheduled_departure_ts).toBe(true);
    expect(t.actual_arrival_ts > t.actual_departure_ts).toBe(true);
  });

  it('writes gps_events for moving buses with real coordinates', () => {
    const g = tel.recent.gps_events[0];
    expect(Object.keys(g)).toEqual(['vehicle_id', 'route_id', 'recorded_at', 'latitude', 'longitude', 'speed_kmh', 'trip_id']);
    expect(g.latitude).toBeGreaterThan(3.0);
    expect(g.latitude).toBeLessThan(3.2);
    expect(g.longitude).toBeGreaterThan(101.6);
  });

  it('keeps only the latest documents in memory but counts them all', () => {
    for (const list of Object.values(tel.recent)) expect(list.length).toBeLessThanOrEqual(RECENT_MAX);
    expect(tel.counts.ride_events).toBeGreaterThan(RECENT_MAX);
  });

  it('newly set queues check in at the time they were set', () => {
    const s2 = createSim({ lines: LINES, routes, seed: 2, startClock: h(13 + 20 / 60) });
    setQueue(s2, 'maple', 10);
    expect(s2.queues.maple.arrivals).toHaveLength(10);
    expect(s2.queues.maple.arrivals.every((t) => t === s2.clock)).toBe(true);
    setQueue(s2, 'maple', 4);
    expect(s2.queues.maple.arrivals).toHaveLength(4);
    run(s2, 60);
    expect(s2.queues.maple.arrivals.length).toBe(s2.queues.maple.queue);
  });
});
