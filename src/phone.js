// Phone card: what a student would see in APSpace — their stop's next bus and line, live.
// Fed by the 3D demo in the same browser (BroadcastChannel) or by Firebase (live/state).
import './phone.css';
import { createChannel } from './live/channel.js';
import { firebaseEnabled, subscribeFirebase } from './live/firebase-sync.js';
import { icon } from './ui/icons.js';
import { formatClock, formatWait } from './ui/format.js';

const KEY = 'smartshuttle.phoneStop.v1';
const STALE_MS = 6000;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const root = document.getElementById('phone');
let state = null;
let source = null;
let lastAt = 0;
let stopId = new URLSearchParams(location.search).get('stop');
if (!stopId) { try { stopId = localStorage.getItem(KEY); } catch { stopId = null; } }

function setStop(id) {
  stopId = id;
  try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
  render();
}

function render() {
  const live = state && Date.now() - lastAt < STALE_MS;
  if (!state) {
    root.innerHTML = `
      <header class="ph-head"><div class="ph-brand">${icon('bus', 22)} SmartShuttle</div></header>
      <section class="ph-card"><p>Waiting for live data…</p>
      <p class="ph-note">Open the SmartShuttle 3D demo in this browser${firebaseEnabled() ? ', or wait for Firebase' : ''} — this card follows it live.</p></section>`;
    return;
  }
  const ids = Object.keys(state.stops);
  if (!stopId || !state.stops[stopId]) stopId = ids[0];
  const s = state.stops[stopId];
  const fill = Math.min(1, s.inLine / Math.max(1, s.capacity));
  const next = s.status === 'Offline' ? '–' : s.nextTime !== null ? formatClock(s.nextTime) : 'Extra bus';
  const sub = s.status === 'Offline' ? 'No more trips to APU today'
    : s.status === 'Ongoing' ? (s.nextBusMin === 0 ? 'Boarding now' : `Bus ${formatWait(s.nextBusMin)} away`)
    : s.late ? 'Running late' : `in ${formatWait(s.nextBusMin)}`;
  root.innerHTML = `
    <header class="ph-head">
      <div class="ph-brand">${icon('bus', 22)} SmartShuttle</div>
      <div class="ph-clock">${formatClock(state.clock)}</div>
    </header>
    <section class="ph-card">
      <select aria-label="My stop">${ids.map((id) => `<option value="${id}" ${id === stopId ? 'selected' : ''}>${esc(state.stops[id].name)} · ${esc(state.stops[id].code)}</option>`).join('')}</select>
      <div class="ph-screen">
        <div class="ph-route"><span>${esc(s.name)} → APU</span><span class="chip" style="background:${s.color}">${esc(s.code)}</span></div>
        <div class="ph-next">${esc(next)}</div>
        <div class="ph-sub">${esc(sub)}</div>
        <div class="ph-row">
          <div class="ph-tile"><small>In line</small><b>${s.inLine}</b></div>
          <div class="ph-tile"><small>Status</small><b data-status="${s.status}">${s.status}</b></div>
        </div>
        <div class="meter ${fill >= 1 ? 'full' : fill >= 0.6 ? 'busy' : ''}" title="Line vs one bus's seats"><span style="width:${fill * 100}%"></span></div>
        <div class="ph-sub" style="font-size:12px">${s.inLine > s.capacity ? 'More people than one bus can take' : `${s.capacity - s.inLine} seats to spare on one bus`}</div>
      </div>
      ${s.alert ? `<div class="ph-alert">${icon('alert', 16)}<span>${esc(s.alert)}</span></div>` : ''}
      <div class="ph-source"><span class="dot ${live ? 'on' : ''}"></span>${live ? `Live via ${source}` : 'Connection lost — showing last update'}</div>
    </section>
    <p class="ph-note">Mock-up of the SmartShuttle card inside APSpace. Simulated data from the hackathon demo.</p>`;
  root.querySelector('select').addEventListener('change', (e) => setStop(e.target.value));
}

function receive(data, from) {
  state = data;
  source = from;
  lastAt = Date.now();
  render();
}

const channel = createChannel();
if (channel) {
  channel.onmessage = (e) => { if (e.data?.type === 'snapshot') receive(e.data.data, 'this laptop'); };
  channel.postMessage({ type: 'hello' });
}
if (firebaseEnabled()) {
  subscribeFirebase((d) => receive(d, 'Firebase'), () => {});
}
setInterval(render, 2000); // keeps the "live / lost" dot honest
render();
