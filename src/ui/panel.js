import { stopScreen, departuresBoard } from '../sim/sim.js';
import { parseTimetableText } from '../sim/overrides.js';
import { trafficFactor, trafficLevel } from '../sim/traffic.js';
import { formatClock, formatWait } from './format.js';

const SPEEDS = [1, 10, 60];
const JUMP_HOURS = [6.5, 7, 7.5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 17.5, 18, 19, 20, 21];
const UI_REFRESH_MS = 200;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function whenText(s) {
  if (s.status === 'Offline') return { main: '–', sub: 'No more trips today' };
  const main = s.nextTime !== null ? formatClock(s.nextTime) : 'Extra';
  let sub;
  if (s.status === 'Ongoing') sub = s.nextBusMin === 0 ? 'Boarding now' : `Bus ${formatWait(s.nextBusMin)} away`;
  else if (s.late) sub = 'Running late';
  else sub = `in ${formatWait(s.nextBusMin)}`;
  return { main, sub: s.limited ? `${sub} · limited space` : sub };
}

// lines: LINES config; stops: { id: {name} }
export function createPanel(app, { lines, stops, onSelectStop, onOverview, getOverrides, onApplyOverrides }) {
  const lineById = Object.fromEntries(lines.map((l) => [l.id, l]));
  const pickupStops = lines.flatMap((l) => l.pickups.map((id) => ({ id, line: l })));

  const root = document.createElement('aside');
  root.className = 'panel';
  root.innerHTML = `
    <header class="panel-head">
      <div>
        <div class="brand">SmartShuttle <span class="pill">Live demo · simulated</span></div>
        <div class="sub">APU Campus Connect · real timetable (22 Oct 2026)</div>
      </div>
      <div class="clock-box">
        <div class="clock" data-k="clock">6:30 AM</div>
        <div class="traffic" data-k="traffic">Traffic</div>
      </div>
    </header>

    <div class="field">
      <label for="stopSelect">Stop</label>
      <select id="stopSelect" data-k="stop">
        <option value="apu">APU Campus — departures home</option>
        ${pickupStops.map(({ id, line }) => `<option value="${id}">${esc(stops[id].name)} · ${esc(line.code)}</option>`).join('')}
      </select>
      <button class="ghost small" data-k="overview" title="Show the whole network">Overview</button>
    </div>

    <section class="screen" data-k="screen" aria-live="polite"></section>

    <form class="queue-form" data-k="queueForm">
      <label for="queueInput">Set waiting</label>
      <select data-k="queueLine" aria-label="APU line for route">
        ${lines.map((l) => `<option value="${l.id}">${esc(l.code)} line</option>`).join('')}
      </select>
      <input id="queueInput" data-k="queueInput" type="number" min="0" max="999" step="1" inputmode="numeric" placeholder="people" />
      <button class="ghost small" type="submit">Set</button>
    </form>
    <section class="bus-info" data-k="busInfo" hidden></section>

    <section class="stats">
      <div><span data-k="boarded">0</span><small>riders boarded</small></div>
      <div><span data-k="extra">0</span><small>extra buses called</small></div>
      <div><span data-k="reroutes">0</span><small>reroutes</small></div>
      <div><span data-k="late">0</span><small>late departures</small></div>
    </section>

    <section class="controls">
      <div class="speed" role="group" aria-label="Simulation speed">
        ${SPEEDS.map((s) => `<button data-speed="${s}">${s}×</button>`).join('')}
      </div>
      <button data-k="pause" class="ghost">Pause</button>
      <label class="jump">Jump to
        <select data-k="jump">
          <option value="">–</option>
          ${JUMP_HOURS.map((h) => `<option value="${h}">${formatClock(h * 3600)}</option>`).join('')}
        </select>
      </label>
    </section>

    <details class="editor" data-k="editor">
      <summary>Edit routes &amp; times</summary>
      <div class="editor-body">
        <div class="editor-row">
          <select data-k="edLine" aria-label="Route to edit">
            ${lines.map((l) => `<option value="${l.id}">${esc(l.code)} · ${esc(l.name)}</option>`).join('')}
          </select>
          <label class="check"><input type="checkbox" data-k="edEnabled" /> Running</label>
        </div>
        <div class="editor-row">
          <label>Buses <input type="number" min="1" max="10" data-k="edFleet" /></label>
          <label>Seats <input type="number" min="4" max="80" data-k="edSeats" /></label>
        </div>
        <label class="stack">Times to APU <textarea rows="3" data-k="edOut" spellcheck="false"></textarea></label>
        <label class="stack">Times from APU <small>(** = limited space)</small><textarea rows="3" data-k="edBack" spellcheck="false"></textarea></label>
        <div class="editor-row">
          <button type="button" class="primary small" data-k="edApply">Apply</button>
          <button type="button" class="ghost small" data-k="edReset">Reset route</button>
          <button type="button" class="ghost small" data-k="edResetAll">Reset all</button>
        </div>
        <p class="editor-msg" data-k="edMsg" role="status"></p>
      </div>
    </details>

    <details class="legend">
      <summary>${lines.length} routes · tap a stop or bus on the map</summary>
      <ul>
        ${lines.map((l) => `<li><i style="background:${l.color}"></i><b>${esc(l.code)}</b> ${esc(l.name)} <small>${esc(l.pass)}</small></li>`).join('')}
      </ul>
      <p class="note">Not mapped yet: UniStay @ Kingston, Bayu Jalil. Traffic and crowds are modelled by hour, not live.</p>
    </details>
  `;
  document.body.appendChild(root);

  const attribution = document.createElement('div');
  attribution.className = 'attribution';
  attribution.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · routes by OSRM';
  document.body.appendChild(attribution);

  const k = (name) => root.querySelector(`[data-k="${name}"]`);
  let stopId = 'apu';
  let busId = null;
  let lastRender = 0;

  function selectStop(id, { focus = true } = {}) {
    stopId = id;
    busId = null;
    k('stop').value = id;
    syncQueueForm();
    if (focus) onSelectStop?.(id);
    render(app.sim, true);
  }
  function selectBus(id) {
    busId = id;
    render(app.sim, true);
  }

  k('stop').addEventListener('change', (e) => selectStop(e.target.value));
  k('overview').addEventListener('click', () => onOverview?.());
  root.querySelectorAll('[data-speed]').forEach((b) =>
    b.addEventListener('click', () => {
      app.speed = Number(b.dataset.speed);
      syncButtons();
    }),
  );
  k('pause').addEventListener('click', () => {
    app.paused = !app.paused;
    syncButtons();
  });
  k('jump').addEventListener('change', (e) => {
    if (!e.target.value) return;
    app.jumpTo(Number(e.target.value) * 3600);
    e.target.value = '';
    busId = null;
    render(app.sim, true);
  });

  // ---- Set waiting --------------------------------------------------------
  function syncQueueForm() {
    k('queueLine').hidden = stopId !== 'apu';
    k('queueInput').value = '';
  }
  k('queueForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = Number(k('queueInput').value);
    const key = stopId === 'apu' ? `apu:${k('queueLine').value}` : stopId;
    if (k('queueInput').value !== '' && app.setQueue(key, n)) {
      k('queueInput').value = '';
      render(app.sim, true);
    }
  });

  // ---- Edit routes & times -------------------------------------------------
  const lineConfig = (id) => ({ ...lineById[id], ...(getOverrides?.()[id] ?? {}) });
  function loadEditor() {
    const id = k('edLine').value;
    const c = lineConfig(id);
    const o = getOverrides?.()[id] ?? {};
    k('edEnabled').checked = o.enabled !== false;
    k('edFleet').value = c.fleet;
    k('edSeats').value = c.capacity;
    k('edOut').value = c.out.join(', ');
    k('edBack').value = c.back.join(', ');
    k('edMsg').textContent = Object.keys(o).length ? 'Edited — differs from APU\'s timetable.' : 'APU timetable (22 Oct 2026).';
  }
  k('edLine').addEventListener('change', loadEditor);
  k('editor').addEventListener('toggle', () => { if (k('editor').open) loadEditor(); });
  k('edApply').addEventListener('click', () => {
    const id = k('edLine').value;
    const out = parseTimetableText(k('edOut').value);
    const back = parseTimetableText(k('edBack').value);
    const bad = [...out.errors, ...back.errors];
    if (bad.length) {
      k('edMsg').textContent = `Can't read: ${bad.join(', ')} — use HH:MM, e.g. 07:45`;
      return;
    }
    const fleet = Math.min(10, Math.max(1, Math.round(Number(k('edFleet').value) || 1)));
    const capacity = Math.min(80, Math.max(4, Math.round(Number(k('edSeats').value) || 4)));
    const next = { ...(getOverrides?.() ?? {}) };
    next[id] = { out: out.times, back: back.times, fleet, capacity, ...(k('edEnabled').checked ? {} : { enabled: false }) };
    onApplyOverrides?.(next);
    loadEditor();
    k('edMsg').textContent = `Applied: ${out.times.length} trips to APU, ${back.times.length} from APU, ${fleet} × ${capacity}-seat.`;
  });
  k('edReset').addEventListener('click', () => {
    const next = { ...(getOverrides?.() ?? {}) };
    delete next[k('edLine').value];
    onApplyOverrides?.(next);
    loadEditor();
  });
  k('edResetAll').addEventListener('click', () => {
    onApplyOverrides?.({});
    loadEditor();
  });

  function syncButtons() {
    root.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === app.speed)));
    k('pause').textContent = app.paused ? 'Play' : 'Pause';
  }

  function renderStop(sim) {
    if (!sim.queues[stopId]) {
      return `<div class="screen-top"><span>${esc(stops[stopId].name)} → APU</span></div><p class="off-note">This route is switched off in “Edit routes &amp; times”.</p>`;
    }
    const s = stopScreen(sim, stopId);
    const line = lineById[s.lineId];
    const w = whenText(s);
    return `
      <div class="screen-top">
        <span>${esc(stops[stopId].name)} → APU</span>
        <span class="chip" style="background:${line.color}">${esc(line.code)}</span>
      </div>
      <div class="tiles">
        <div class="tile"><div class="tile-label">Next bus</div><div class="tile-value">${esc(w.main)}</div><div class="tile-sub">${esc(w.sub)}</div></div>
        <div class="tile"><div class="tile-label">In line</div><div class="tile-value">${s.inLine}</div><div class="tile-sub">${s.inLine > line.capacity ? 'more than one bus' : `${line.capacity}-seat ${line.vehicle}`}</div></div>
        <div class="tile"><div class="tile-label">Status</div><div class="tile-value" data-status="${s.status}">${s.status}</div></div>
      </div>
      ${s.alert ? `<div class="alert">${esc(s.alert)}</div>` : ''}`;
  }

  function renderBoard(sim) {
    const rows = departuresBoard(sim).map((s) => {
      const line = lineById[s.lineId];
      const w = whenText(s);
      return `<tr>
        <td><i style="background:${line.color}"></i>${esc(line.code)}</td>
        <td><b>${esc(w.main)}</b><small>${esc(w.sub)}</small></td>
        <td class="num">${s.inLine}</td>
        <td data-status="${s.status}">${s.status}</td>
      </tr>${s.alert ? `<tr class="alert-row"><td colspan="4">${esc(s.alert)}</td></tr>` : ''}`;
    });
    return `
      <div class="screen-top"><span>APU Campus — departures home</span></div>
      <table class="board">
        <thead><tr><th>Route</th><th>Next</th><th class="num">In line</th><th>Status</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>`;
  }

  function render(sim, force = false) {
    const now = performance.now();
    if (!force && now - lastRender < UI_REFRESH_MS) return;
    lastRender = now;

    const clock = formatClock(sim.clock);
    k('clock').textContent = sim.running ? clock : `${clock} · ended`;
    const f = trafficFactor(sim.clock);
    const traffic = k('traffic');
    traffic.textContent = `Traffic: ${trafficLevel(f)} ×${f.toFixed(1)}`;
    traffic.dataset.level = trafficLevel(f);

    k('screen').innerHTML = stopId === 'apu' ? renderBoard(sim) : renderStop(sim);

    const info = k('busInfo');
    const bus = busId && sim.buses.find((b) => b.id === busId);
    if (bus) {
      const line = lineById[bus.line];
      const where = bus.detour
        ? `rerouted: ${bus.detour.kind === 'pickup' ? 'picking up' : 'dropping'} ${bus.detour.n} at ${stops[bus.detour.stopId]?.name}`
        : bus.state === 'driving'
        ? `heading to ${stops[bus.dest]?.name ?? bus.dest}`
        : bus.state === 'dwelling' ? `boarding at ${stops[bus.at]?.name}` : `parked at ${stops[bus.at]?.name}`;
      const trip = bus.trip
        ? `${bus.trip.extra ? 'extra trip' : `${formatClock(bus.trip.t)} trip`}${bus.trip.lateSec > 120 ? ` · left ${Math.round(bus.trip.lateSec / 60)} min late` : ''}`
        : 'not in service';
      info.hidden = false;
      info.innerHTML = `<i style="background:${line.color}"></i><strong>${esc(bus.id)}</strong> ${esc(line.name)} · ${bus.load}/${bus.capacity} riders · ${esc(where)} · ${esc(trip)}`;
    } else {
      info.hidden = true;
      busId = null;
    }

    k('boarded').textContent = sim.stats.boarded;
    k('extra').textContent = sim.stats.extraBuses;
    k('late').textContent = sim.stats.lateDepartures;
    k('reroutes').textContent = sim.stats.reroutes;
  }

  selectStop('apu', { focus: false });
  syncButtons();
  return { render, selectStop, selectBus };
}
