// Firebase tab: the documents the stop boxes and bus trackers would write, and the
// BigQuery-style calculations the dashboard runs on them.
import { COLLECTIONS } from '../sim/telemetry.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const WHO = {
  queue_events: 'stop box camera · every minute',
  ride_events: 'face check-in → boarding → drop-off',
  gps_events: 'bus LoRa tracker · every 30 s',
  trips: 'one per departure',
};

export function firebaseCalcs(sim) {
  const tel = sim.telemetry;
  const routes = Object.values(tel.agg.routes);
  const trips = routes.reduce((n, r) => n + r.trips, 0);
  const late = routes.reduce((n, r) => n + r.late, 0);
  const maxQ = Object.entries(tel.agg.maxQueue ?? {}).sort((a, b) => b[1] - a[1])[0];
  const busiest = Object.entries(tel.agg.routes).sort((a, b) => b[1].boarded - a[1].boarded)[0];
  const d = tel.serviceDate;
  return [
    {
      label: 'Average wait',
      value: tel.agg.waitN ? `${(tel.agg.waitSum / tel.agg.waitN / 60).toFixed(1)} min` : '–',
      sql: `SELECT AVG(TIMESTAMP_DIFF(boarding_ts, check_in_ts, SECOND)) / 60\nFROM smartshuttle.ride_events WHERE service_date = '${d}'`,
    },
    {
      label: 'On-time departures',
      value: trips ? `${Math.round((100 * (trips - late)) / trips)}% of ${trips}` : '–',
      sql: `SELECT COUNTIF(actual_departure_ts <= TIMESTAMP_ADD(scheduled_departure_ts, INTERVAL 2 MINUTE)) / COUNT(*)\nFROM smartshuttle.trips WHERE service_date = '${d}'`,
    },
    {
      label: 'Longest line seen',
      value: maxQ ? `${maxQ[1]} at ${sim.stopNames[maxQ[0]] ?? maxQ[0]}` : '–',
      sql: `SELECT stop_id, MAX(queue_count) AS peak\nFROM smartshuttle.queue_events GROUP BY stop_id ORDER BY peak DESC LIMIT 1`,
    },
    {
      label: 'Busiest route',
      value: busiest ? `${sim.lines[busiest[0]]?.cfg.code ?? busiest[0]} · ${busiest[1].boarded} riders` : '–',
      sql: `SELECT route_id, COUNT(*) AS riders\nFROM smartshuttle.ride_events GROUP BY route_id ORDER BY riders DESC LIMIT 1`,
    },
  ];
}

export function renderFirebase(sim, { collection }) {
  const tel = sim.telemetry;
  const counts = COLLECTIONS.map(
    (c) => `<tr><td><code>${c}</code><small>${WHO[c]}</small></td><td class="num">${tel.counts[c].toLocaleString()}</td></tr>`,
  ).join('');
  const calcs = firebaseCalcs(sim)
    .map((c) => `<li><div class="calc-head"><span>${esc(c.label)}</span><b>${esc(c.value)}</b></div><pre class="sql">${esc(c.sql)}</pre></li>`)
    .join('');
  const docs = tel.recent[collection].slice(0, 3);
  return `
    <section class="card">
      <p class="sync">Documents in the team's BigQuery schema (dataset <code>smartshuttle</code>). Counts are from the simulation; with live sync on, the newest are written to Firestore.</p>
      <table class="mini"><thead><tr><th>Collection</th><th class="num">Docs today</th></tr></thead><tbody>${counts}</tbody></table>
    </section>
    <section class="card">
      <h3>Calculations on the data</h3>
      <ul class="calcs">${calcs}</ul>
    </section>
    <section class="card">
      <h3>Latest <code>${collection}</code> documents</h3>
      <pre class="json">${esc(JSON.stringify(docs, null, 2))}</pre>
    </section>`;
}

export function exportTelemetry(sim) {
  const tel = sim.telemetry;
  const blob = new Blob([JSON.stringify({ service_date: tel.serviceDate, counts: tel.counts, latest: tel.recent }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `smartshuttle-firebase-${tel.serviceDate}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}
