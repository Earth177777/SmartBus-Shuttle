// Students joining each stop's line per minute, by hour of day (mock demand).
export function arrivalsPerMinute(stopId, hour) {
  const morning = hour >= 7 && hour < 9;
  const evening = hour >= 17 && hour < 19;
  switch (stopId) {
    case 'lrt':
      return morning || evening ? 6 : 2;
    case 'parkhill':
      return morning ? 2 : 0.5;
    case 'apu':
      return hour >= 15 && hour < 19 ? 4 : 1;
    default:
      return 0;
  }
}
