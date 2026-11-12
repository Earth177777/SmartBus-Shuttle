import { describe, it, expect } from 'vitest';
import { makePolyline } from '../src/sim/polyline.js';
import { buildGraph, route, buildRoutes } from '../src/sim/routing.js';
import area from '../src/data/area.json';

describe('makePolyline', () => {
  const line = makePolyline([[0, 0], [100, 0], [100, 50]]);

  it('measures total length', () => {
    expect(line.length).toBeCloseTo(150, 6);
  });

  it('starts at the first point and ends at the last', () => {
    expect(line.pointAt(0)).toMatchObject({ x: 0, z: 0 });
    expect(line.pointAt(150)).toMatchObject({ x: 100, z: 50 });
  });

  it('clamps beyond the end', () => {
    expect(line.pointAt(250)).toMatchObject({ x: 100, z: 50 });
    expect(line.pointAt(-10)).toMatchObject({ x: 0, z: 0 });
  });

  it('interpolates and reports heading along +x', () => {
    const p = line.pointAt(50);
    expect(p.x).toBeCloseTo(50, 6);
    expect(p.heading).toBeCloseTo(Math.PI / 2, 6); // atan2(dx=1, dz=0)
  });
});

describe('route', () => {
  it('follows the corner of an L-shaped road set', () => {
    const g = buildGraph([{ pts: [[0, 0], [100, 0]] }, { pts: [[100, 0], [100, 100]] }]);
    const path = route(g, { x: 0, z: 0 }, { x: 100, z: 100 });
    expect(path).toEqual([[0, 0], [100, 0], [100, 100]]);
  });

  it('falls back when disconnected', () => {
    const g = buildGraph([{ pts: [[0, 0], [10, 0]] }, { pts: [[500, 500], [510, 500]] }]);
    const path = route(g, { x: 0, z: 0 }, { x: 510, z: 500 });
    expect(path).toEqual([[0, 0], [510, 500]]);
  });
});

describe('buildRoutes on the real area', () => {
  const routes = buildRoutes(area);
  // Reference driving distances from OSRM (OpenStreetMap router), 12 Nov 2026.
  // Our graph ignores one-way rules, so routes may be shorter, never much longer.
  const pairs = {
    lrt_apu: ['lrt', 'apu', 4115],
    apu_lrt: ['apu', 'lrt', 4115],
    parkhill_apu: ['parkhill', 'apu', 720],
    parkhill_lrt: ['parkhill', 'lrt', 3007],
    apu_parkhill: ['apu', 'parkhill', 720],
  };
  for (const [key, [a, b, osrm]] of Object.entries(pairs)) {
    it(`${key} follows roads (≥ straight line, ≤ 1.5× OSRM ${osrm} m)`, () => {
      const A = area.stops[a];
      const B = area.stops[b];
      const straight = Math.hypot(B.x - A.x, B.z - A.z);
      expect(routes[key].length).toBeGreaterThanOrEqual(straight);
      expect(routes[key].length).toBeLessThanOrEqual(osrm * 1.5);
      expect(routes[key].pts.length).toBeGreaterThan(2);
    });
  }
});
