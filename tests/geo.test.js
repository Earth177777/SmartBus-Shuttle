import { describe, it, expect } from 'vitest';
import { project, ORIGIN } from '../src/geo.js';

describe('project', () => {
  it('maps the APU origin to (0, 0)', () => {
    const p = project(ORIGIN.lat, ORIGIN.lon);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it('puts Bukit Jalil LRT about 1 km from APU', () => {
    const p = project(3.0583, 101.6922);
    const d = Math.hypot(p.x, p.z);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1100);
  });

  it('points north to negative z and east to positive x', () => {
    expect(project(ORIGIN.lat + 0.001, ORIGIN.lon).z).toBeLessThan(0);
    expect(project(ORIGIN.lat, ORIGIN.lon + 0.001).x).toBeGreaterThan(0);
  });
});
