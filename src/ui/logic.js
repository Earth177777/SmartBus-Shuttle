// Logic tab: the live numbers behind every smart decision.
import { REROUTE } from '../sim/reroute.js';
import { trafficFactor, trafficLevel, BUS_SLOWDOWN } from '../sim/traffic.js';
import { demandPerMinute } from '../sim/demand.js';
import { formatClock } from './format.js';
import { icon } from './icons.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const min = (sec) => `${(sec / 60).toFixed(1)} min`;

function checkChip(c) {
  const v = c.unit === 's' ? min(c.value) : c.value;
  const lim = c.unit === 's' ? min(c.limit) : c.limit;
  return `<span class="check ${c.pass ? 'pass' : 'fail'}">${esc(c.label)} ${esc(v)} ${c.op} ${esc(lim)} ${icon(c.pass ? 'yes' : 'no', 11)}</span>`;
}

function decisionRow(d, lineById, stopNames) {
  const when = formatClock(d.t);
  const line = lineById[d.lineId];
  const stop = stopNames[d.stopId] ?? d.stopId;
  const verdict = `<span class="verdict ${d.ok ? 'ok' : 'no'}">${icon(d.ok ? 'yes' : 'no', 11)}${d.ok ? 'YES' : 'NO'}</span>`;
  if (d.kind === 'extra') {
    const i = d.inputs;
    return `<li><div class="d-head">${verdict}<b>Extra bus?</b> ${esc(line?.code ?? '')} at ${esc(stop)} <small>${when}</small></div>
      <div class="d-math">line ${i.queue} &gt; seats ${i.capacity} ${icon('yes', 11)} · next trip in ${i.gapMin ?? '–'} min (needs &gt; ${i.minGapMin}) · ${esc(d.reason)}</div></li>`;
  }
  const i = d.inputs;
  const what = d.kind === 'pickup' ? `${esc(d.busId)} pick up at ${esc(stop)}` : `${esc(d.busId)} take ${esc(line?.code ?? '')} riders home to ${esc(stop)}`;
  return `<li><div class="d-head">${verdict}<b>Reroute?</b> ${what} <small>${when}</small></div>
    <div class="d-math">excess = ${i.queue} waiting − ${i.seatsComing} seats coming = <b>${i.excess}</b> · detour = 2×${i.offM} m ÷ ${(REROUTE.DETOUR_SPEED_MPS * 3.6).toFixed(0)} km/h × ${i.traffic} + ${REROUTE.STOP_SEC}s = <b>${min(i.detourSec)}</b></div>
    <div class="d-checks">${d.checks.map(checkChip).join('')}</div></li>`;
}

export function renderLogic(sim, { lines, lineById }) {
  const f = trafficFactor(sim.clock);
  const travel = f * BUS_SLOWDOWN;
  const lrt = sim.lines.lrt;
  const lrtFree = lrt ? lrt.out.reduce((s, l) => s + l.path.duration, 0) : 0;
  const demandRows = lines
    .filter((l) => sim.lines[l.id])
    .map((l) => {
      const L = sim.lines[l.id];
      return `<tr><td><i style="background:${l.color}"></i>${esc(l.code)}</td><td class="num">${demandPerMinute({ demand: L.peak.out }, 'out', sim.clock).toFixed(2)}</td><td class="num">${demandPerMinute({ demand: L.peak.back }, 'back', sim.clock).toFixed(2)}</td></tr>`;
    })
    .join('');
  const decisions = sim.decisions.slice(0, 10).map((d) => decisionRow(d, lineById, sim.stopNames)).join('');
  return `
    <section class="card">
      <h3>Reroute rule</h3>
      <p class="formula">reroute ⇔ excess ≥ ${REROUTE.MIN_EXCESS} ∧ free seats ≥ ${REROUTE.MIN_FREE_SEATS} ∧ detour ≤ ${REROUTE.MAX_DETOUR_SEC / 60} min ∧ delay + detour ≤ ${REROUTE.PROMISE_BUFFER_SEC / 60} min</p>
      <p class="muted">excess = people waiting − seats arriving there in the next ${REROUTE.NEXT_BUS_WINDOW_SEC / 60} min · stops within ${REROUTE.CORRIDOR_M} m of a bus's road count as "on its route" · riders taken = min(free seats, excess)</p>
      <h3>Extra bus rule</h3>
      <p class="formula">call a spare ⇔ line &gt; one bus's seats ∧ next trip &gt; 10 min away ∧ a spare is free for a round trip</p>
    </section>
    <section class="card">
      <h3>Travel time now · ${formatClock(sim.clock)}</h3>
      <p class="formula">ETA = free-flow time × traffic ${f.toFixed(2)} (${trafficLevel(f)}) × bus ${BUS_SLOWDOWN} = × ${travel.toFixed(2)}</p>
      ${lrt ? `<p class="muted">e.g. LRT → APU: ${min(lrtFree)} free-flow → <b>${min(lrtFree * travel)}</b> now</p>` : ''}
    </section>
    <section class="card">
      <h3>Demand now (people joining per minute)</h3>
      <table class="mini"><thead><tr><th>Route</th><th class="num">to APU</th><th class="num">home</th></tr></thead><tbody>${demandRows}</tbody></table>
      <p class="muted">Peak rate × share of the day's peak at this hour; each route's peak is sized so a day fills ~60% of its timetabled seats (LRT 90%).</p>
    </section>
    <section class="card">
      <h3>Latest decisions</h3>
      ${decisions ? `<ul class="decisions">${decisions}</ul>` : '<p class="muted">No decisions yet — set a long line at a stop (click its “In line” number) to see one.</p>'}
    </section>`;
}
