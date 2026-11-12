// What the system would write to Firebase (and stream to BigQuery), using the field
// names of the team's BigQuery tables: queue_events, ride_events, gps_events, trips.
// Kept in memory: totals for every collection, the latest RECENT_MAX documents each,
// and running aggregates for the Data tab.

export const RECENT_MAX = 50;
export const COLLECTIONS = ['queue_events', 'ride_events', 'gps_events', 'trips'];

export function createTelemetry(serviceDate) {
  return {
    serviceDate,
    counts: Object.fromEntries(COLLECTIONS.map((c) => [c, 0])),
    recent: Object.fromEntries(COLLECTIONS.map((c) => [c, []])),
    agg: { waitSum: 0, waitN: 0, waitMax: 0, alighted: 0, routes: {}, hourly: Array(24).fill(0) },
    seq: 0,
  };
}

const pad = (n) => String(n).padStart(2, '0');

// Seconds since midnight on the service day → "2026-11-13T07:30:05+08:00" (Malaysia time).
export function tsISO(serviceDate, clockSec) {
  const s = Math.floor(clockSec);
  return `${serviceDate}T${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}+08:00`;
}

export function record(tel, collection, doc) {
  tel.counts[collection]++;
  const list = tel.recent[collection];
  list.unshift(doc);
  if (list.length > RECENT_MAX) list.pop();
  return doc;
}

export function routeAgg(tel, routeId) {
  return (tel.agg.routes[routeId] ??= { trips: 0, late: 0, boarded: 0, seatsOffered: 0, peakBuses: 0 });
}

export const nextId = (tel, prefix) => `${prefix}-${(++tel.seq).toString(36).padStart(5, '0')}`;
