import './style.css';
import * as THREE from 'three';
import area from './data/area.json';
import { buildRoutes } from './sim/routing.js';
import { createSim, stepSim } from './sim/sim.js';
import { createWorld } from './scene/world.js';
import { createBusLayer } from './scene/buses.js';
import { createStopLayer } from './scene/stops.js';
import { createPanel } from './ui/panel.js';

const MAX_REAL_DT = 0.25; // seconds; a background tab must not jump the sim forward
const CLICK_SLOP_PX = 6; // a drag longer than this orbits the camera instead of picking

const container = document.getElementById('map');
const routes = buildRoutes(area);
const world = createWorld(container, area, routes);
const busLayer = createBusLayer(world.scene, area.stops);
const stopLayer = createStopLayer(world.scene, area.stops);

const newSeed = () => Math.floor(Math.random() * 1e6);
const app = {
  sim: createSim({ routes, seed: newSeed() }),
  speed: 10,
  paused: false,
  reset() {
    this.sim = createSim({ routes, seed: newSeed() });
  },
};
app.world = world;
window.smartshuttle = app; // handy for debugging in the console

const panel = createPanel(app, {
  onSelectStop: (id) => world.focus(area.stops[id].x, area.stops[id].z),
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
  busLayer.sync(app.sim);
  stopLayer.sync(app.sim);
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
