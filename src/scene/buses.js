import * as THREE from 'three';
import { COLORS } from './world.js';
import { makeLabel } from './label.js';

// Buses are drawn larger than life so they read at campus scale.
const BODY = { w: 12, h: 11, l: 30 };

function fillColor(frac) {
  if (frac >= 0.9) return 0xef4444;
  if (frac >= 0.5) return 0xf59e0b;
  return 0x22c55e;
}

function makeBusObject(bus) {
  const g = new THREE.Group();
  const color = bus.extra ? COLORS.extra : bus.line === 'parkhill' ? COLORS.parkhill : COLORS.lrt;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(BODY.w, BODY.h, BODY.l),
    new THREE.MeshLambertMaterial({ color }),
  );
  body.position.y = BODY.h / 2 + 1;
  body.userData.busId = bus.id;
  g.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(BODY.w * 0.9, 1, BODY.l * 0.9),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  roof.position.y = BODY.h + 1.5;
  g.add(roof);

  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2.5, 1),
    new THREE.MeshBasicMaterial({ color: 0x22c55e }),
  );
  fill.position.y = BODY.h + 6;
  g.add(fill);

  const label = makeLabel(bus.id, { bg: '#111827', scale: 0.8 });
  label.position.y = BODY.h + 22;
  g.add(label);

  g.userData = { body, fill, label, lastLoad: -1 };
  return g;
}

export function createBusLayer(scene, stops) {
  const objects = new Map();
  const pickables = [];

  function sync(sim) {
    const alive = new Set();
    for (const bus of sim.buses) {
      alive.add(bus.id);
      let obj = objects.get(bus.id);
      if (!obj) {
        obj = makeBusObject(bus);
        objects.set(bus.id, obj);
        scene.add(obj);
        pickables.push(obj.userData.body);
      }
      if (bus.state === 'driving' && bus.path) {
        const p = bus.path.pointAt(bus.d);
        obj.position.set(p.x, 0, p.z);
        obj.rotation.y = p.heading;
      } else if (bus.atStop) {
        // Parked: always snap to the current stop (also after "Restart day" reuses ids).
        const s = stops[bus.atStop];
        obj.position.set(s.x, 0, s.z);
      }

      if (bus.load !== obj.userData.lastLoad) {
        const frac = bus.load / bus.capacity;
        const { fill } = obj.userData;
        fill.scale.x = Math.max(frac * BODY.l, 0.01);
        fill.material.color.setHex(fillColor(frac));
        obj.userData.label.userData.setText(`${bus.id} · ${bus.load}/${bus.capacity}`);
        obj.userData.lastLoad = bus.load;
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
