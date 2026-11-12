import { stopScreen, departuresBoard, SERVICE_START, SERVICE_END } from '../sim/sim.js';
import { parseTimetableText } from '../sim/overrides.js';
import { trafficFactor, trafficLevel } from '../sim/traffic.js';
import { optimizeFleet } from '../sim/optimize.js';
import { COLLECTIONS } from '../sim/telemetry.js';
import { formatClock, formatWait } from './format.js';
import { openPopover, closePopover } from './popover.js';
import { icon } from './icons.js';
import { renderLogic } from './logic.js';
import { renderAnalytics, renderOptimizerResult } from './analytics.js';
import { renderFirebase, exportTelemetry } from './firebase.js';
import { renderImpact, renderAllScenarios, compareAll } from './impact.js';
import { compareDays } from '../sim/compare.js';
import { SCENARIOS } from '../sim/scenarios.js';

const SPEEDS = [1, 10, 60];
const TABS = [
  ['live', 'Live', 'bus'],
  ['impact', 'Impact', 'impact'],
  ['logic', 'Logic', 'logic'],
  ['analytics', 'Analytics', 'analytics'],
  ['firebase', 'Firebase', 'database'],
  ['edit', 'Edit', 'settings'],
];
const UI_REFRESH_MS = { live: 200, impact: Infinity, logic: 500, analytics: 700, firebase: 700, edit: Infinity };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hhmm = (sec) => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;

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
export function createPanel(app, { lines, stops, onSelectStop, onOverview, getOverrides, onApplyOverrides, onTour, onScenario, onCamera, phoneUrl, qrSvg, firebase }) {
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
    </header>

    <nav class="tabs" role="tablist">
      ${TABS.map(([id, label, ic]) => `<button role="tab" data-tab="${id}">${icon(ic, 15)}<span>${label}</span></button>`).join('')}
      <button class="tour-btn" data-k="tour" title="Guided tour" aria-label="Guided tour">${icon('help', 18)}</button>
    </nav>

    <div class="tab" data-pane="live">
      <div class="field">
        <label for="stopSelect">Stop</label>
        <select id="stopSelect" data-k="stop">
          <option value="apu">APU Campus — departures home</option>
          ${pickupStops.map(({ id, line }) => `<option value="${id}">${esc(stops[id].name)} · ${esc(line.code)}</option>`).join('')}
        </select>
        <button class="ghost small" data-k="overview" title="Show the whole network">Overview</button>
      </div>
      <div class="scenarios" role="group" aria-label="Scenario">
        ${SCENARIOS.map((sc) => `<button class="scen" data-scenario="${sc.id}" title="${esc(sc.description)}">${icon(sc.icon, 14)}<span>${esc(sc.name)}</span></button>`).join('')}
      </div>
      <section class="screen" data-k="screen" aria-live="polite"></section>
      <div class="actions">
        <button class="ghost small" data-k="camera">${icon('camera', 14)} Camera stop box</button>
        <button class="ghost small" data-k="phone">${icon('phone', 14)} Phone view</button>
      </div>
      <p class="hint">Tip: click any <b>In line</b> number to set how many people are waiting, or the clock to change the time.</p>
      <section class="bus-info" data-k="busInfo" hidden></section>
      <section class="stats" data-k="stats">
        <div><span data-k="boarded">0</span><small>riders boarded</small></div>
        <div><span data-k="extra">0</span><small>extra buses</small></div>
        <div><span data-k="reroutes">0</span><small>reroutes</small></div>
        <div><span data-k="late">0</span><small>late trips</small></div>
      </section>
      <section class="controls">
        <div class="speed" role="group" aria-label="Simulation speed">
          ${SPEEDS.map((s) => `<button data-speed="${s}">${s}×</button>`).join('')}
        </div>
        <button data-k="pause" class="ghost">Pause</button>
      </section>
    </div>

    <div class="tab" data-pane="impact" hidden>
      <section class="card">
        <h3>Today vs SmartShuttle</h3>
        <p class="muted">The same weekday run twice — as APU runs it now, and with SmartShuttle — for the scenario picked on the Live tab.</p>
        <div class="editor-row">
          <button class="primary small" data-k="runImpact">${icon('impact', 14)} Run comparison</button>
          <button class="ghost small" data-k="runAll">Compare all days</button>
        </div>
      </section>
      <div class="tab" data-k="impactBody"></div>
      <div data-k="impactAll"></div>
    </div>

    <div class="tab" data-pane="logic" hidden><div class="tab" data-k="logicBody"></div></div>

    <div class="tab" data-pane="analytics" hidden>
      <div class="tab" data-k="analyticsBody"></div>
      <section class="card optimizer" data-k="optimizer">
        <h3>Fleet optimizer</h3>
        <p class="muted">Replays the whole weekday for each route and finds the fewest buses that still run every trip on time.</p>
        <div class="editor-row">
          <label>Max buses <input type="number" min="1" max="60" data-k="maxBuses" /></label>
          <button class="primary small" data-k="optimize">Optimize</button>
          <button class="ghost small" data-k="optApply" disabled>Apply to routes</button>
        </div>
        <div data-k="optResult"></div>
      </section>
    </div>

    <div class="tab" data-pane="firebase" hidden>
      <div class="editor-row">
        <label>Show <select data-k="fbCollection">${COLLECTIONS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <button class="ghost small" data-k="fbExport">${icon('download', 14)} Export JSON</button>
      </div>
      <div class="tab" data-k="firebaseBody"></div>
    </div>

    <div class="tab" data-pane="edit" hidden>
      <section class="editor" data-k="editor">
        <h3>Routes &amp; times</h3>
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
      </section>
      <details class="legend">
        <summary>${lines.length} routes</summary>
        <ul>
          ${lines.map((l) => `<li><i style="background:${l.color}"></i><b>${esc(l.code)}</b> ${esc(l.name)} <small>${esc(l.pass)}</small></li>`).join('')}
        </ul>
        <p class="note">Not mapped yet: UniStay @ Kingston, Bayu Jalil. Traffic and crowds are modelled by hour, not live.</p>
      </details>
    </div>
  `;
  document.body.appendChild(root);

  const attribution = document.createElement('div');
  attribution.className = 'attribution';
  attribution.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · routes by OSRM';
  document.body.appendChild(attribution);

  // Time + traffic, top-right corner of the map.
  const hud = document.createElement('button');
  hud.className = 'hud';
  hud.title = 'Change the time';
  hud.innerHTML = `
    <span class="hud-icon">${icon('clock', 22)}</span>
    <span class="hud-main"><span class="hud-time" data-h="time">6:30 AM</span><span class="hud-date" data-h="date">Fri 13 Nov · weekday timetable</span></span>
    <span class="hud-edit">${icon('edit', 14)}</span>
    <span class="traffic" data-h="traffic">${icon('traffic', 13)}<span>Traffic</span></span>`;
  document.body.appendChild(hud);
  const h = (name) => hud.querySelector(`[data-h="${name}"]`);

  const k = (name) => root.querySelector(`[data-k="${name}"]`);
  let stopId = 'apu';
  let busId = null;
  let tab = 'live';
  let lastRender = 0;
  let lastOpt = null;

  // ---- Tabs -----------------------------------------------------------------
  function selectTab(id) {
    tab = id;
    root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    root.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== id; });
    if (id === 'edit') loadEditor();
    if (id === 'analytics' && !k('maxBuses').value) k('maxBuses').value = app.sim.buses.length;
    closePopover();
    render(app.sim, true);
  }
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.tab)));
  k('tour').addEventListener('click', () => onTour?.());

  // ---- Stop & bus selection ---------------------------------------------------
  function selectStop(id, { focus = true } = {}) {
    stopId = id;
    busId = null;
    k('stop').value = id;
    if (focus) onSelectStop?.(id);
    render(app.sim, true);
  }
  function selectBus(id) {
    busId = id;
    if (tab !== 'live') selectTab('live');
    render(app.sim, true);
  }
  k('stop').addEventListener('change', (e) => selectStop(e.target.value));
  k('overview').addEventListener('click', () => onOverview?.());

  // ---- Speed / pause ---------------------------------------------------------
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
  function syncButtons() {
    root.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === app.speed)));
    k('pause').innerHTML = app.paused ? `${icon('play', 14)} Play` : `${icon('pause', 14)} Pause`;
  }

  // ---- Click the clock to change the time -----------------------------------
  hud.addEventListener('click', () => {
    openPopover(hud, {
      label: 'Jump to time (weekday)',
      type: 'time',
      min: hhmm(SERVICE_START),
      max: hhmm(SERVICE_END),
      value: hhmm(app.sim.clock),
      hint: 'Service runs 06:30–22:30. The day replays up to the time you pick.',
      onSubmit: (v) => {
        const m = /^(\d{1,2}):(\d{2})/.exec(v);
        if (!m) return 'Pick a time';
        const sec = Number(m[1]) * 3600 + Number(m[2]) * 60;
        if (sec < SERVICE_START || sec > SERVICE_END) return 'Between 06:30 and 22:30';
        app.jumpTo(sec);
        busId = null;
        render(app.sim, true);
        return true;
      },
    });
  });

  // ---- Click an "In line" number to set the queue ----------------------------
  root.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-queue-key]');
    if (!cell) return;
    const key = cell.dataset.queueKey;
    const q = app.sim.queues[key];
    if (!q) return;
    const where = key.startsWith('apu:') ? `APU line for ${lineById[key.slice(4)]?.name ?? ''}` : stops[key]?.name;
    openPopover(cell, {
      label: `People waiting · ${esc(where)}`,
      type: 'number',
      min: 0,
      max: 999,
      value: q.queue,
      onSubmit: (v) => {
        if (v === '' || !app.setQueue(key, Number(v))) return 'Enter 0–999';
        render(app.sim, true);
        return true;
      },
    });
  });

  // ---- Scenarios ---------------------------------------------------------------
  function syncScenario() {
    root.querySelectorAll('[data-scenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scenario === app.sim.scenario.id)));
  }
  root.querySelectorAll('[data-scenario]').forEach((b) =>
    b.addEventListener('click', () => {
      onScenario?.(b.dataset.scenario);
      syncScenario();
      impactCache = null;
      render(app.sim, true);
    }),
  );

  // ---- Camera & phone ------------------------------------------------------------
  k('camera').addEventListener('click', () => onCamera?.(stopId === 'apu' ? 'lrt' : stopId));
  k('phone').addEventListener('click', () => {
    const pop = openPopover(k('phone'), { label: 'Phone view', type: 'number', onSubmit: () => true });
    pop.querySelector('.popover-row').outerHTML = `<div class="qr">${(typeof qrSvg === 'function' ? qrSvg() : qrSvg) ?? ''}</div>`;
    pop.insertAdjacentHTML('beforeend', `<a class="primary small open-phone" href="${phoneUrl}" target="_blank" rel="noopener">${icon('phone', 14)} Open phone view</a>
      <p class="popover-hint">${firebase?.status.enabled ? 'Scan to follow live on a phone (via Firebase).' : 'Opens beside this demo and follows it live. To follow from a real phone, connect Firebase.'}</p>`);
  });

  // ---- Impact ----------------------------------------------------------------------
  let impactCache = null;
  const activeCfgs = () => lines.filter((l) => app.sim.lines[l.id]).map((l) => app.sim.lines[l.id].cfg);
  function runImpact() {
    k('impactBody').innerHTML = '<p class="muted">Running the day twice…</p>';
    setTimeout(() => {
      impactCache = compareDays(activeCfgs(), app.routes, { seed: 4, scenario: app.sim.scenario.id });
      k('impactBody').innerHTML = renderImpact(impactCache);
    }, 20);
  }
  k('runImpact').addEventListener('click', runImpact);
  k('runAll').addEventListener('click', () => {
    k('impactAll').innerHTML = '<p class="muted">Running every scenario twice…</p>';
    setTimeout(() => {
      k('impactAll').innerHTML = `<section class="card"><h3>Every scenario</h3>${renderAllScenarios(compareAll(activeCfgs(), app.routes, 4))}</section>`;
    }, 20);
  });

  // ---- Firebase tab ------------------------------------------------------------
  k('fbCollection').addEventListener('change', () => render(app.sim, true));
  k('fbExport').addEventListener('click', () => exportTelemetry(app.sim));

  // ---- Optimizer ---------------------------------------------------------------
  const activeLines = () => lines.filter((l) => app.sim.lines[l.id]).map((l) => app.sim.lines[l.id].cfg);
  k('optimize').addEventListener('click', () => {
    const raw = Number(k('maxBuses').value);
    const maxBuses = raw >= 1 ? Math.round(raw) : Infinity;
    k('optResult').innerHTML = '<p class="muted">Replaying the day for every route…</p>';
    setTimeout(() => {
      lastOpt = optimizeFleet(activeLines(), app.routes, { maxBuses });
      k('optResult').innerHTML = renderOptimizerResult(lastOpt, { lineById, maxBuses });
      k('optApply').disabled = false;
    }, 20);
  });
  k('optApply').addEventListener('click', () => {
    if (!lastOpt) return;
    const next = { ...(getOverrides?.() ?? {}) };
    for (const r of lastOpt.routes) next[r.lineId] = { ...(next[r.lineId] ?? {}), fleet: r.recommended };
    onApplyOverrides?.(next);
    k('optApply').disabled = true;
    k('maxBuses').value = app.sim.buses.length;
    k('optResult').insertAdjacentHTML('beforeend', '<p class="ok-note">Applied — the day replays with the new fleet.</p>');
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

  // ---- Live screens ------------------------------------------------------------
  function renderStop(sim) {
    if (!sim.queues[stopId]) {
      return `<div class="screen-top"><span>${esc(stops[stopId].name)} → APU</span></div><p class="off-note">This route is switched off in the Edit tab.</p>`;
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
        <button class="tile editable" data-queue-key="${stopId}" title="Set people waiting"><div class="tile-label">In line ${icon('edit', 12)}</div><div class="tile-value">${s.inLine}</div><div class="tile-sub">${s.inLine > line.capacity ? 'more than one bus' : `${line.capacity}-seat ${line.vehicle}`}</div></button>
        <div class="tile"><div class="tile-label">Status</div><div class="tile-value" data-status="${s.status}">${s.status}</div></div>
      </div>
      ${s.alert ? `<div class="alert">${icon('alert', 15)}<span>${esc(s.alert)}</span></div>` : ''}`;
  }

  function renderBoard(sim) {
    const rows = departuresBoard(sim).map((s) => {
      const line = lineById[s.lineId];
      const w = whenText(s);
      return `<tr>
        <td><i style="background:${line.color}"></i>${esc(line.code)}</td>
        <td><b>${esc(w.main)}</b><small>${esc(w.sub)}</small></td>
        <td class="num"><button class="queue-edit" data-queue-key="apu:${s.lineId}" title="Set people waiting">${s.inLine}</button></td>
        <td data-status="${s.status}">${s.status}</td>
      </tr>${s.alert ? `<tr class="alert-row"><td colspan="4">${icon('alert', 13)} ${esc(s.alert)}</td></tr>` : ''}`;
    });
    return `
      <div class="screen-top"><span>APU Campus — departures home</span></div>
      <table class="board">
        <thead><tr><th>Route</th><th>Next</th><th class="num">In line ${icon('edit', 12)}</th><th>Status</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>`;
  }

  function renderLive(sim) {
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

  function render(sim, force = false) {
    const now = performance.now();
    if (!force && now - lastRender < UI_REFRESH_MS[tab]) return;
    // Don't redraw under an open editor — it would replace what is being clicked.
    if (!force && document.querySelector('.popover')) return;
    lastRender = now;

    const clock = formatClock(sim.clock);
    h('time').textContent = clock;
    h('date').textContent = sim.running ? 'Fri 13 Nov · weekday timetable' : 'Service ended for today';
    const f = trafficFactor(sim.clock);
    const traffic = h('traffic');
    traffic.lastChild.textContent = `Traffic: ${trafficLevel(f)} ×${f.toFixed(1)}`;
    traffic.dataset.level = trafficLevel(f);

    if (tab === 'live') renderLive(sim);
    else if (tab === 'logic') k('logicBody').innerHTML = renderLogic(sim, { lines, lineById });
    else if (tab === 'analytics') k('analyticsBody').innerHTML = renderAnalytics(sim, { lineById });
    else if (tab === 'firebase') k('firebaseBody').innerHTML = renderFirebase(sim, { collection: k('fbCollection').value });
    else if (tab === 'impact' && !impactCache && force) runImpact();
  }

  selectTab('live');
  selectStop('apu', { focus: false });
  syncButtons();
  syncScenario();
  return { render, selectStop, selectBus, selectTab, root, hud };
}
