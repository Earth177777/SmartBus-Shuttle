import { profileAt } from './profile.js';

// Share of a route's peak demand by time of day (modelled on class times).
// 'out' = students heading to APU; 'back' = students heading home from APU.
const TO_APU = [
  [6.5, 0.1], [7, 0.7], [7.5, 1], [8.5, 1], [9, 0.7], [10, 0.45], [11.5, 0.4], [12.5, 0.45],
  [13.5, 0.3], [15, 0.2], [16, 0.12], [17, 0.06], [19, 0.02], [24, 0],
];
const FROM_APU = [
  [6.5, 0], [10, 0.05], [11, 0.25], [12, 0.45], [13, 0.55], [14, 0.35], [15.5, 0.45],
  [16.5, 0.75], [17.5, 1], [18.5, 0.8], [19.5, 0.35], [20.5, 0.25], [21.5, 0.15], [22, 0],
];

export function demandPerMinute(line, dir, clockSec) {
  return line.demand * profileAt(dir === 'out' ? TO_APU : FROM_APU, clockSec);
}

// Integral of a direction's profile over the day, in minutes at peak rate.
function peakMinutes(dir) {
  let total = 0;
  for (let t = 0; t < 24 * 3600; t += 60) total += profileAt(dir === 'out' ? TO_APU : FROM_APU, t);
  return total;
}
const PEAK_MINUTES = { out: peakMinutes('out'), back: peakMinutes('back') };

// Peak students/minute so a day's riders fill `load` of the seats the timetable offers.
export function peakRateForTimetable(trips, capacity, load, dir) {
  return (trips * capacity * load) / PEAK_MINUTES[dir];
}
