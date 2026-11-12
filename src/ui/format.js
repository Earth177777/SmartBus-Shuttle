// Seconds since midnight → "h:mm AM/PM".
export function formatClock(sec) {
  const h24 = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// Minutes until something → "12 min" / "3 h 35 min".
export function formatWait(min) {
  if (min <= 0) return 'now';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
