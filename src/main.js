import './style.css';
import * as THREE from 'three';
import area from './data/area.json';
import routes from './data/routes.json';
import { LINES } from './data/lines.js';
import { createSim, stepSim, setQueue, SERVICE_START } from './sim/sim.js';
import { applyOverrides } from './sim/overrides.js';
import { createWorld } from './scene/world.js';
import { createBusLayer } from './scene/buses.js';
import { createStopLayer } from './scene/stops.js';
import { createPanel } from './ui/panel.js';

const MAX_REAL_DT = 0.25; // seconds; a background tab must not jump the sim forward
const CLICK_SLOP_PX = 6; // a drag longer than this orbits the camera instead of picking
const FOCUS_DISTANCE = 1400; // metres from a selected stop

const container = document.getElementById('map');
const stops = routes.stops;
const lineColors = Object.fromEntries(LINES.map((l) => [l.id, l.color]));
const stopColors = Object.fromEntries(LINES.flatMap((l) => l.pickups.map((s) => [s, l.color])));
const routeById = Object.fromEntries(routes.lines.map((r) => [r.id, r]));
const lineViews = LINES.map((l) => ({
  id: l.id,
  color: l.color,
  out: routeById[l.id].outbound.map((leg) => leg.pts),
  back: routeById[l.id].inbound.map((leg) => leg.pts),
}));

const world = createWorld(container, { ...area, stops }, lineViews);
const busLayer = createBusLayer(world.scene, stops, lineColors);
const queueOf = (sim, stopId) =>
  stopId === 'apu'
    ? Object.entries(sim.queues).filter(([k]) => k.startsWith('apu:')).reduce((n, [, q]) => n + q.queue, 0)
    : sim.queues[stopId]?.queue ?? 0;
const stopLayer = createStopLayer(world.scene, stops, stopColors, queueOf);

// Route edits live in this browser only (localStorage may be unavailable: then they last for the visit).
const OVERRIDES_KEY = 'smartshuttle.overrides.v1';
let overrides = {};
try { overrides = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}') ?? {}; } catch { overrides = {}; }
function saveOverrides() {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides)); } catch { /* private mode etc. */ }
}

const newSeed = () => Math.floor(Math.random() * 1e6);
const makeSim = (startClock = SERVICE_START) =>
  createSim({ lines: applyOverrides(LINES, overrides), routes, seed: newSeed(), startClock });
const app = {
  sim: makeSim(7 * 3600),
  speed: 10,
  paused: false,
  reset() {
    this.sim = makeSim();
  },
  jumpTo(clockSec) {
    this.sim = makeSim(clockSec);
  },
  setQueue(key, n) {
    return setQueue(this.sim, key, n);
  },
};
function syncLineVisibility() {
  for (const l of LINES) world.setLineVisible(l.id, overrides[l.id]?.enabled !== false);
}
syncLineVisibility();
app.world = world;
window.smartshuttle = app; // handy for debugging in the console

const panel = createPanel(app, {
  lines: LINES,
  stops,
  onSelectStop: (id) => world.focus(stops[id].x, stops[id].z, FOCUS_DISTANCE),
  onOverview: () => world.overview(),
  getOverrides: () => overrides,
  onApplyOverrides: (next) => {
    overrides = next;
    saveOverrides();
    syncLineVisibility();
    app.jumpTo(app.sim.clock); // replay today up to now with the edited routes
  },
});

// Click a stop or bus to select and focus it.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let down = null;
world.renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
world.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX) return;
  const rect = world.renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, world.camera);
  const hit = raycaster.intersectObjects([...stopLayer.pickables, ...busLayer.pickables], false)[0];
  if (!hit) return;
  const { stopId, busId } = hit.object.userData;
  if (stopId) panel.selectStop(stopId);
  if (busId) {
    const p = hit.object.getWorldPosition(new THREE.Vector3());
    world.focus(p.x, p.z);
    panel.selectBus(busId);
  }
});

function draw(forcePanel = false) {
  busLayer.sync(app.sim, world.camera);
  stopLayer.sync(app.sim, world.camera);
  panel.render(app.sim, forcePanel);
  world.update();
  world.renderer.render(world.scene, world.camera);
}

// Debug: jump the simulation forward and redraw, even when the tab isn't animating.
app.advance = (simSeconds, step = 5) => {
  for (let t = 0; t < simSeconds; t += step) stepSim(app.sim, step);
  draw(true);
  return app.sim.clock;
};

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_REAL_DT);
  last = now;
  if (!app.paused) stepSim(app.sim, dt * app.speed);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
