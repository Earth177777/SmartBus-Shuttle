import { describe, it, expect } from 'vitest';
import routes from '../src/data/routes.json';

const line = (id) => routes.lines.find((l) => l.id === id);
const roads = (legs) => legs.flatMap((l) => l.roads);

describe('baked routes match how the buses really drive', () => {
  it('Parkhill leaves from the front gate on Susur Jalil Sejahtera, not the Jalan Teknologi 2 back lane', () => {
    const out = roads(line('parkhill').outbound);
    expect(out[0]).toBe('Susur Jalil Sejahtera');
    expect(out).not.toContain('Jalan Teknologi 2');
    expect(out).toContain('Lebuhraya Kuala Lumpur–Seremban');
  });

  it('LRT runs Jalan Barat (Endah side) onto the highway', () => {
    const out = roads(line('lrt').outbound);
    expect(out).toContain('Jalan Barat');
    expect(out).toContain('Lebuhraya Bukit Jalil');
    expect(out).toContain('Lebuhraya Kuala Lumpur–Seremban');
  });
});
