// Seconds since midnight → "h:mm AM/PM".
export function formatClock(sec) {
  const h24 = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
