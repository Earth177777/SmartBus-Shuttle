import { profileAt } from './profile.js';

// Travel-time multiplier over free-flow, typical KL weekday (modelled, not live data).
// Morning rush 7:30–9:00, evening rush 17:30–19:00, near free-flow at night.
const WEEKDAY = [
  [0, 1.0], [6.5, 1.0], [7, 1.4], [7.5, 1.9], [9, 1.9], [9.5, 1.4], [10, 1.15], [12, 1.15],
  [12.5, 1.3], [14, 1.3], [14.5, 1.2], [16.5, 1.25], [17, 1.8], [17.5, 2.1], [19, 2.1],
  [19.5, 1.5], [20.5, 1.2], [21.5, 1.05], [24, 1.0],
];

// Shuttles run slower than the cars OSRM's free-flow times assume.
export const BUS_SLOWDOWN = 1.15;

export function trafficFactor(clockSec) {
  return profileAt(WEEKDAY, clockSec);
}

export function trafficLevel(factor) {
  if (factor < 1.2) return 'Light';
  if (factor < 1.6) return 'Moderate';
  return 'Heavy';
}
