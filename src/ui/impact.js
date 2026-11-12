// Impact tab: the same weekday run twice — as APU runs it today, and with SmartShuttle.
import { compareDays } from '../sim/compare.js';
import { SCENARIOS, scenarioById } from '../sim/scenarios.js';
import { icon } from './icons.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// [key, label, format, better: 'lower' | 'higher' | 'cost']
const MEASURES = [
  ['avgWaitMin', 'Average wait', (v) => `${v.toFixed(1)} min`, 'lower'],
  ['waitedOver30', 'Waited over 30 min', (v) => Math.round(v).toLocaleString(), 'lower'],
  ['leftBehind', 'Left behind by a full bus', (v) => Math.round(v).toLocaleString(), 'lower'],
  ['stranded', 'Never got a bus', (v) => Math.round(v).toLocaleString(), 'lower'],
  ['riders', 'Riders carried', (v) => Math.round(v).toLocaleString(), 'higher'],
  ['busKm', 'Bus-km driven (cost)', (v) => `${Math.round(v).toLocaleString()} km`, 'cost'],
];

function change(today, smart) {
  if (!today) return smart ? '+∞' : '0%';
  const p = Math.round((100 * (smart - today)) / today);
  return `${p > 0 ? '+' : ''}${p}%`;
}

export function renderImpact(c) {
  const sc = scenarioById(c.scenario);
  const rows = MEASURES.map(([key, label, fmt, better]) => {
    const t = c.today[key];
    const s = c.smart[key];
    const max = Math.max(t, s, 1e-9);
    const good = better === 'lower' ? s < t : better === 'higher' ? s > t : null;
    const cls = good === null ? 'cost' : good ? 'good' : s === t ? '' : 'bad';
    return `<li class="impact-row">
      <div class="impact-head"><span>${esc(label)}</span><b class="${cls}">${change(t, s)}</b></div>
      <div class="impact-bar today"><span style="width:${(100 * t) / max}%"></span><em>Today ${fmt(t)}</em></div>
      <div class="impact-bar smart"><span style="width:${(100 * s) / max}%"></span><em>SmartShuttle ${fmt(s)}</em></div>
    </li>`;
  }).join('');
  return `
    <section class="card">
      <h3>${icon(sc.icon, 14)} ${esc(sc.name)} · same students, same buses</h3>
      <p class="muted">${esc(sc.description)}</p>
      <ul class="impact">${rows}</ul>
      <p class="muted">SmartShuttle also called <b>${c.smart.extraBuses}</b> spare buses for overflowing lines and made <b>${c.smart.reroutes}</b> reroutes.
      Today = APU's timetable as published (no extra buses, no rerouting). Riders arrive the same way in both runs (up to 20 min before their trip); someone who never gets a bus is counted as waiting until they give up after an hour.</p>
    </section>`;
}

export function renderAllScenarios(results) {
  const rows = results.map((c) => {
    const sc = scenarioById(c.scenario);
    return `<tr><td>${icon(sc.icon, 13)} ${esc(sc.name)}</td><td class="num">${c.today.avgWaitMin.toFixed(1)} → <b>${c.smart.avgWaitMin.toFixed(1)}</b></td><td class="num">${c.today.stranded} → <b>${c.smart.stranded}</b></td><td class="num good">${change(c.today.avgWaitMin, c.smart.avgWaitMin)}</td></tr>`;
  }).join('');
  return `<table class="mini"><thead><tr><th>Day</th><th class="num">Avg wait (min)</th><th class="num">Never got a bus</th><th class="num">Wait</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function compareAll(lines, routes, seed) {
  return SCENARIOS.map((s) => compareDays(lines, routes, { seed, scenario: s.id }));
}
