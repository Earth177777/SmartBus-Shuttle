export const BUS_SPEED_MPS = 25 / 3.6; // 25 km/h
export const BUS_CAPACITY = 40;

export function createBus(id, line) {
  return {
    id,
    line, // 'lrt' | 'parkhill'
    state: 'idle', // 'idle' | 'driving' | 'dwelling'
    path: null,
    d: 0,
    load: 0,
    capacity: BUS_CAPACITY,
    dwellLeft: 0,
    dest: null,
    extra: false,
  };
}

export function startTrip(bus, path, dest) {
  bus.path = path;
  bus.d = 0;
  bus.dest = dest;
  bus.state = 'driving';
}

// Move along the path; returns 'arrived' exactly once, on the step that reaches the end.
export function advanceBus(bus, dtSec) {
  if (bus.state !== 'driving' || !bus.path) return null;
  bus.d = Math.min(bus.d + BUS_SPEED_MPS * dtSec, bus.path.length);
  if (bus.d >= bus.path.length) {
    bus.state = 'idle';
    return 'arrived';
  }
  return null;
}

export function etaSeconds(bus) {
  const remaining = bus.state === 'driving' && bus.path ? bus.path.length - bus.d : 0;
  return remaining / BUS_SPEED_MPS + (bus.state === 'dwelling' ? bus.dwellLeft : 0);
}
