import { describe, it, expect } from 'vitest';
import { createBus, startTrip, advanceBus, etaSeconds, BUS_SPEED_MPS } from '../src/sim/bus.js';
import { makePolyline } from '../src/sim/polyline.js';

const km = () => makePolyline([[0, 0], [1000, 0]]);

describe('bus movement', () => {
  it('starts idle with capacity 40', () => {
    const bus = createBus('L1', 'lrt');
    expect(bus).toMatchObject({ id: 'L1', line: 'lrt', state: 'idle', load: 0, capacity: 40, extra: false });
  });

  it('drives 1 km in 144 s at 25 km/h', () => {
    expect(BUS_SPEED_MPS).toBeCloseTo(25 / 3.6, 6);
    const bus = createBus('L1', 'lrt');
    startTrip(bus, km(), 'apu');
    expect(bus.state).toBe('driving');
    expect(advanceBus(bus, 143)).toBe(null);
    expect(advanceBus(bus, 1.1)).toBe('arrived');
  });

  it('does not overshoot at large dt', () => {
    const bus = createBus('L1', 'lrt');
    startTrip(bus, km(), 'apu');
    expect(advanceBus(bus, 3600)).toBe('arrived');
    expect(bus.d).toBe(1000);
    expect(advanceBus(bus, 10)).toBe(null);
  });

  it('reports ETA from remaining distance', () => {
    const bus = createBus('L1', 'lrt');
    startTrip(bus, km(), 'apu');
    advanceBus(bus, 72);
    expect(etaSeconds(bus)).toBeCloseTo(72, 0);
  });

  it('adds remaining dwell to ETA', () => {
    const bus = createBus('L1', 'lrt');
    bus.state = 'dwelling';
    bus.dwellLeft = 30;
    expect(etaSeconds(bus)).toBe(30);
  });
});
