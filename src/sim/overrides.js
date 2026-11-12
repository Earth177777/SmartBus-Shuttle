// User edits to routes: timetable, fleet, seats, on/off. Applied on top of APU's schedule.

const TIME_RE = /^(\*\*)?(\d{1,2}):(\d{2})$/;

// "9:00, 07:30\n**21:45" → { times: ['07:30', '09:00', '**21:45'], errors: [] }
export function parseTimetableText(text) {
  const times = new Map(); // HH:MM → token (keeps the ** marker)
  const errors = [];
  for (const raw of String(text).split(/[\s,;]+/).filter(Boolean)) {
    const m = TIME_RE.exec(raw);
    const hh = m ? Number(m[2]) : NaN;
    const mm = m ? Number(m[3]) : NaN;
    if (!m || hh > 23 || mm > 59) {
      errors.push(raw);
      continue;
    }
    const hm = `${String(hh).padStart(2, '0')}:${m[3]}`;
    times.set(hm, (m[1] ?? '') + hm);
  }
  return { times: [...times.keys()].sort().map((k) => times.get(k)), errors };
}

// overrides: { lineId: { out?, back?, fleet?, capacity?, enabled? } }
export function applyOverrides(lines, overrides = {}) {
  return lines
    .filter((l) => overrides[l.id]?.enabled !== false)
    .map((l) => {
      const o = overrides[l.id];
      if (!o) return l;
      const { enabled, ...rest } = o;
      return { ...l, ...rest };
    });
}
