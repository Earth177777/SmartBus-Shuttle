// Timetable helpers for APU's published Campus Connect schedule.

export function parseTime(s) {
  const limited = s.startsWith('**');
  const [hh, mm] = s.replace(/^\*+/, '').split(':').map(Number);
  return { t: hh * 3600 + mm * 60, limited };
}

// All departures of a line for one weekday: {t, dir: 'out'|'back', limited, continuous}.
export function buildDepartures(line) {
  const deps = [
    ...line.out.map((s) => ({ ...parseTime(s), dir: 'out', continuous: false })),
    ...line.back.map((s) => ({ ...parseTime(s), dir: 'back', continuous: false })),
  ];
  if (line.continuous) {
    // "Continuous pattern, will not follow a schedule": a bus every N minutes between the times.
    const [from, to, everyMin] = line.continuous;
    const start = parseTime(from).t;
    const end = parseTime(to).t;
    const timetabled = new Set(deps.filter((d) => d.dir === 'out').map((d) => d.t));
    for (let t = start + everyMin * 60; t < end; t += everyMin * 60) {
      if (!timetabled.has(t)) deps.push({ t, dir: 'out', limited: false, continuous: true });
    }
  }
  return deps.sort((a, b) => a.t - b.t || (a.dir < b.dir ? -1 : 1));
}

// Later pickups on a multi-stop route leave a fixed number of minutes after the first.
export function pickupOffsetSec(line, stopId) {
  return (line.pickupOffsetMin?.[stopId] ?? 0) * 60;
}
