// Analytics tab: how many buses are deployed, how well the day is going, and the fleet optimizer.
import { formatClock } from './format.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–');

export function analyticsSnapshot(sim) {
  const tel = sim.telemetry;
  const inService = sim.buses.filter((b) => b.trip).length;
  const routes = Object.values(sim.lines).map((L) => {
    const a = tel.agg.routes[L.cfg.id] ?? { trips: 0, late: 0, boarded: 0, seatsOffered: 0, peakBuses: 0 };
    return {
      id: L.cfg.id,
      fleet: L.cfg.fleet,
      now: sim.buses.filter((b) => b.line === L.cfg.id && b.trip).length,
      ...a,
    };
  });
  const trips = routes.reduce((n, r) => n + r.trips, 0);
  const late = routes.reduce((n, r) => n + r.late, 0);
  const boarded = routes.reduce((n, r) => n + r.boarded, 0);
  const seats = routes.reduce((n, r) => n + r.seatsOffered, 0);
  return {
    fleet: sim.buses.length,
    inService,
    peakDeployed: Math.max(tel.agg.peakNetwork ?? 0, inService),
    avgWaitMin: tel.agg.waitN ? tel.agg.waitSum / tel.agg.waitN / 60 : 0,
    maxWaitMin: tel.agg.waitMax / 60,
    onTime: pct(trips - late, trips),
    load: pct(boarded, seats),
    trips,
    routes,
    hourly: tel.agg.hourly,
  };
}

export function renderAnalytics(sim, { lineById }) {
  const s = analyticsSnapshot(sim);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const maxH = Math.max(1, ...hours.map((h) => s.hourly[h]));
  const nowH = Math.floor(sim.clock / 3600);
  const bars = hours
    .map((h) => `<div class="bar${h === nowH ? ' now' : ''}" title="${h}:00 · ${s.hourly[h]} riders"><span style="height:${(100 * s.hourly[h]) / maxH}%"></span><small>${h}</small></div>`)
    .join('');
  const rows = s.routes
    .map((r) => {
      const l = lineById[r.id];
      return `<tr><td><i style="background:${l.color}"></i>${esc(l.code)}</td><td class="num">${r.now}/${r.fleet}</td><td class="num">${r.peakBuses}</td><td class="num">${r.trips}</td><td class="num">${pct(r.trips - r.late, r.trips)}</td><td class="num">${r.boarded}</td><td class="num">${pct(r.boarded, r.seatsOffered)}</td></tr>`;
    })
    .join('');
  return `
    <section class="kpis">
      <div><b>${s.inService}<small>/${s.fleet}</small></b><span>buses on a trip now</span></div>
      <div><b>${s.peakDeployed}</b><span>peak deployed today</span></div>
      <div><b>${s.avgWaitMin.toFixed(1)}<small> min</small></b><span>average wait</span></div>
      <div><b>${s.maxWaitMin.toFixed(0)}<small> min</small></b><span>longest wait</span></div>
      <div><b>${s.onTime}</b><span>trips on time (≤2 min)</span></div>
      <div><b>${s.load}</b><span>seats filled</span></div>
    </section>
    <section class="card">
      <h3>Riders boarded by hour · up to ${formatClock(sim.clock)}</h3>
      <div class="bars">${bars}</div>
    </section>
    <section class="card">
      <h3>Per route</h3>
      <table class="mini"><thead><tr><th>Route</th><th class="num">Now</th><th class="num">Peak</th><th class="num">Trips</th><th class="num">On time</th><th class="num">Riders</th><th class="num">Load</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
}

export function renderOptimizerResult(res, { lineById, maxBuses }) {
  const rows = res.routes
    .map((r) => {
      const l = lineById[r.lineId];
      const diff = r.recommended - r.current;
      const tag = diff === 0 ? 'same' : diff > 0 ? `+${diff}` : `${diff}`;
      return `<tr><td><i style="background:${l.color}"></i>${esc(l.code)}</td><td class="num">${r.current}</td><td class="num"><b>${r.recommended}</b> <small class="delta ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${tag}</small></td><td class="num">${r.result.latePct.toFixed(0)}%</td><td class="num">${r.result.avgLateMin.toFixed(1)}</td></tr>`;
    })
    .join('');
  const current = res.routes.reduce((n, r) => n + r.current, 0);
  const note = res.infeasible
    ? `Even 1 bus per route needs ${res.total} buses — more than the cap of ${maxBuses}.`
    : res.capped
      ? `Capped at ${maxBuses}: buses were taken from the routes that suffer least.`
      : 'Smallest fleet per route with every trip run and ≤10% of trips more than 5 min late.';
  return `
    <p class="opt-summary"><b>${res.total}</b> buses recommended (now ${current}). ${esc(note)}</p>
    <table class="mini"><thead><tr><th>Route</th><th class="num">Now</th><th class="num">Best</th><th class="num">Late</th><th class="num">Avg late min</th></tr></thead><tbody>${rows}</tbody></table>`;
}
