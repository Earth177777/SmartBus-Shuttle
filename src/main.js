import './style.css';
import area from './data/area.json';
import { buildRoutes } from './sim/routing.js';
import { createSim, stepSim } from './sim/sim.js';
import { createWorld } from './scene/world.js';
import { createBusLayer } from './scene/buses.js';
import { createStopLayer } from './scene/stops.js';

const MAX_REAL_DT = 0.25; // seconds; a background tab must not jump the sim forward

const container = document.getElementById('map');
const routes = buildRoutes(area);
const world = createWorld(container, area, routes);
const busLayer = createBusLayer(world.scene, area.stops);
const stopLayer = createStopLayer(world.scene, area.stops);

export const app = {
  sim: createSim({ routes, seed: Date.now() % 100000 }),
  speed: 10,
  paused: false,
  routes,
  area,
  world,
  busLayer,
  stopLayer,
  listeners: [],
  reset() {
    this.sim = createSim({ routes, seed: Date.now() % 100000 });
  },
};
window.smartshuttle = app; // handy for debugging in the console

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_REAL_DT);
  last = now;
  if (!app.paused) stepSim(app.sim, dt * app.speed);
  busLayer.sync(app.sim);
  stopLayer.sync(app.sim);
  for (const fn of app.listeners) fn(app.sim);
  world.update();
  world.renderer.render(world.scene, world.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
