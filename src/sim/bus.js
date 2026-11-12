import { BUS_SPEED_MPS, BUS_CAPACITY } from './constants.js';

export { BUS_SPEED_MPS, BUS_CAPACITY };

export function createBus(id, line, capacity = BUS_CAPACITY) {
  return {
    id,
    line,
    state: 'idle', // 'idle' | 'driving' | 'dwelling'
    path: null,
    d: 0, // metres along the path
    tt: 0, // free-flow seconds along the path
    load: 0,
    capacity,
    dwellLeft: 0,
    dest: null,
    extra: false,
  };
}

export function startTrip(bus, path, dest) {
  bus.path = path;
  bus.d = 0;
  bus.tt = 0;
  bus.dest = dest;
  bus.state = 'driving';
}

// Move along the path; `factor` stretches travel time (traffic). Returns 'arrived' exactly once.
export function advanceBus(bus, dtSec, factor = 1) {
  if (bus.state !== 'driving' || !bus.path) return null;
  bus.tt = Math.min(bus.tt + dtSec / factor, bus.path.duration);
  bus.d = bus.path.distanceAtTime(bus.tt);
  if (bus.tt >= bus.path.duration) {
    bus.d = bus.path.length;
    bus.state = 'idle';
    return 'arrived';
  }
  return null;
}

export function etaSeconds(bus, factor = 1) {
  const remaining = bus.state === 'driving' && bus.path ? (bus.path.duration - bus.tt) * factor : 0;
  return remaining + (bus.state === 'dwelling' ? bus.dwellLeft : 0);
}
