import { stopScreen } from '../sim/sim.js';
import { formatClock } from './format.js';

const STOP_TITLES = {
  lrt: 'LRT Bukit Jalil → APU',
  parkhill: 'Parkhill → APU',
  apu: 'APU → LRT Bukit Jalil',
};
const STOP_SHORT = { lrt: 'LRT Bukit Jalil', parkhill: 'Parkhill', apu: 'APU' };
const DEST_NAMES = { lrt: 'LRT Bukit Jalil', parkhill: 'Parkhill', apu: 'APU' };
const SPEEDS = [1, 10, 60];
const UI_REFRESH_MS = 200;

const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

export function createPanel(app, { onSelectStop }) {
  const root = el('aside', 'panel');
  root.innerHTML = `
    <header class="panel-head">
      <div>
        <div class="brand">SmartShuttle <span class="pill">Live demo · simulated</span></div>
        <div class="sub">Crowd-aware buses for APU</div>
      </div>
      <div class="clock" data-k="clock">7:00 AM</div>
    </header>

    <div class="tabs" role="tablist" aria-label="Stop">
      ${['lrt', 'parkhill', 'apu'].map((id) => `<button role="tab" data-stop="${id}">${STOP_SHORT[id]}</button>`).join('')}
    </div>

    <section class="screen" aria-live="polite">
      <div class="screen-top">
        <span data-k="title"></span>
        <span data-k="screenClock"></span>
      </div>
      <div class="tiles">
        <div class="tile"><div class="tile-label">Next bus</div><div class="tile-value" data-k="next">–</div></div>
        <div class="tile"><div class="tile-label">In line</div><div class="tile-value" data-k="inLine">0</div></div>
        <div class="tile"><div class="tile-label">Status</div><div class="tile-value" data-k="status">–</div></div>
      </div>
      <div class="alert" data-k="alert" hidden></div>
    </section>

    <section class="bus-info" data-k="busInfo" hidden></section>

    <section class="stats">
      <div><span data-k="boarded">0</span><small>riders boarded</small></div>
      <div><span data-k="extra">0</span><small>extra buses called</small></div>
      <div><span data-k="smart">0</span><small>smart stops at LRT</small></div>
    </section>

    <section class="controls">
      <div class="speed" role="group" aria-label="Simulation speed">
        ${SPEEDS.map((s) => `<button data-speed="${s}">${s}×</button>`).join('')}
      </div>
      <button data-k="pause" class="ghost">Pause</button>
      <button data-k="reset" class="ghost">Restart day</button>
    </section>

    <footer class="legend">
      <span><i style="background:var(--lrt)"></i>LRT ↔ APU (free)</span>
      <span><i style="background:var(--parkhill)"></i>Parkhill → APU</span>
      <span><i style="background:var(--extra)"></i>Extra bus</span>
    </footer>
  `;
  document.body.appendChild(root);

  const attribution = el('div', 'attribution', '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors (ODbL)');
  document.body.appendChild(attribution);

  const k = (name) => root.querySelector(`[data-k="${name}"]`);
  let stopId = 'lrt';
  let busId = null;
  let lastRender = 0;

  function selectStop(id, { focus = true } = {}) {
    stopId = id;
    busId = null;
    root.querySelectorAll('[data-stop]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.stop === id)));
    if (focus) onSelectStop?.(id);
    render(app.sim, true);
  }
  function selectBus(id) {
    busId = id;
    render(app.sim, true);
  }

  root.querySelectorAll('[data-stop]').forEach((b) => b.addEventListener('click', () => selectStop(b.dataset.stop)));
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
  k('reset').addEventListener('click', () => {
    app.reset();
    busId = null;
    render(app.sim, true);
  });

  function syncButtons() {
    root.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === app.speed)));
    k('pause').textContent = app.paused ? 'Play' : 'Pause';
  }

  function render(sim, force = false) {
    const now = performance.now();
    if (!force && now - lastRender < UI_REFRESH_MS) return;
    lastRender = now;

    const clock = formatClock(sim.clock);
    k('clock').textContent = sim.running ? clock : `${clock} · service ended`;
    k('title').textContent = STOP_TITLES[stopId];
    k('screenClock').textContent = clock;

    const s = stopScreen(sim, stopId);
    k('next').textContent = s.nextBusMin === null ? '–' : s.nextBusMin === 0 ? 'Now' : `${s.nextBusMin} min`;
    k('inLine').textContent = s.inLine;
    const status = k('status');
    status.textContent = s.status;
    status.dataset.status = s.status;
    const alert = k('alert');
    alert.hidden = !s.alert;
    alert.textContent = s.alert ?? '';

    const info = k('busInfo');
    const bus = busId && sim.buses.find((b) => b.id === busId);
    if (bus) {
      const where = bus.state === 'driving'
        ? `heading to ${DEST_NAMES[bus.dest]}${bus.smartStop ? ' · smart stop at LRT' : ''}`
        : bus.state === 'dwelling' ? `boarding at ${DEST_NAMES[bus.atStop]}` : `waiting at ${DEST_NAMES[bus.atStop] ?? 'depot'}`;
      info.hidden = false;
      info.innerHTML = `<strong>${bus.id}${bus.extra ? ' (extra)' : ''}</strong> · ${bus.load}/${bus.capacity} riders · ${where}`;
    } else {
      info.hidden = true;
      if (busId) busId = null; // bus finished its run
    }

    k('boarded').textContent = sim.stats.boarded;
    k('extra').textContent = sim.stats.extraBuses;
    k('smart').textContent = sim.stats.smartStops;
  }

  selectStop('lrt', { focus: false }); // keep the opening overview of the whole map
  syncButtons();
  return { render, selectStop, selectBus };
}
