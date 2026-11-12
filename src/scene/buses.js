import * as THREE from 'three';
import { makeLabel } from './label.js';

// Drawn larger than life so they read at network scale; grow further when zoomed out.
const BODY = { bus: { w: 12, h: 11, l: 30 }, van: { w: 9, h: 9, l: 18 } };
const SCREEN_GROWTH = 1 / 900; // extra scale per metre of camera distance

function fillColor(frac) {
  if (frac >= 0.9) return 0xef4444;
  if (frac >= 0.5) return 0xf59e0b;
  return 0x22c55e;
}

function makeBusObject(bus, color) {
  const dims = BODY[bus.vehicle] ?? BODY.bus;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(dims.w, dims.h, dims.l), new THREE.MeshLambertMaterial({ color }));
  body.position.y = dims.h / 2 + 1;
  body.userData.busId = bus.id;
  g.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(dims.w * 0.9, 1, dims.l * 0.9),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  roof.position.y = dims.h + 1.5;
  g.add(roof);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 1), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  fill.position.y = dims.h + 6;
  g.add(fill);
  const label = makeLabel(bus.id, { bg: '#111827', scale: 0.6 });
  label.position.y = dims.h + 14;
  g.add(label);
  g.userData = { body, fill, label, dims, lastKey: '' };
  return g;
}

// lineColors: { lineId: '#rrggbb' }
export function createBusLayer(scene, stops, lineColors) {
  const objects = new Map();
  const pickables = [];

  function sync(sim, camera) {
    const alive = new Set();
    for (const bus of sim.buses) {
      alive.add(bus.id);
      let obj = objects.get(bus.id);
      if (!obj) {
        obj = makeBusObject(bus, lineColors[bus.line] ?? '#334155');
        objects.set(bus.id, obj);
        scene.add(obj);
        pickables.push(obj.userData.body);
      }
      if (bus.detour && stops[bus.detour.stopId]) {
        // Rerouted: pulled in at another route's stop.
        const s = stops[bus.detour.stopId];
        obj.position.set(s.x - 10, 0, s.z - 10);
      } else if (bus.state === 'driving' && bus.path) {
        const p = bus.path.pointAt(bus.d);
        obj.position.set(p.x, 0, p.z);
        obj.rotation.y = p.heading;
      } else if (bus.at && stops[bus.at]) {
        // Parked: always snap to the current stop (also after a restart reuses ids).
        const s = stops[bus.at];
        obj.position.set(s.x, 0, s.z);
      }
      if (camera) {
        const k = Math.max(1, camera.position.distanceTo(obj.position) * SCREEN_GROWTH);
        obj.scale.setScalar(k);
        obj.userData.label.userData.setParentScale(k);
      }

      // Only buses on a trip get a label; parked ones would bury the stop names.
      const inService = !!bus.trip;
      obj.userData.label.visible = inService;
      const key = `${bus.load}/${inService}`;
      if (key !== obj.userData.lastKey) {
        const frac = bus.load / bus.capacity;
        const { fill, label, dims } = obj.userData;
        fill.scale.x = Math.max(frac * dims.l, 0.01);
        fill.material.color.setHex(fillColor(frac));
        label.userData.setText(`${bus.id} · ${bus.load}/${bus.capacity}`);
        obj.userData.lastKey = key;
      }
    }
    for (const [id, obj] of objects) {
      if (!alive.has(id)) {
        scene.remove(obj);
        pickables.splice(pickables.indexOf(obj.userData.body), 1);
        objects.delete(id);
      }
    }
  }

  return { sync, pickables, objects };
}
