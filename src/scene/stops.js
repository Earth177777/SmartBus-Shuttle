import * as THREE from 'three';
import { makeLabel } from './label.js';

const MAX_PEOPLE = 60;
const PER_ROW = 10;
const SPACING = 4.5;
const STOP_COLORS = { apu: 0x0f766e, lrt: 0x2563eb, parkhill: 0xf59e0b };

// A pin per stop, plus a visible line of people whose length = queue (capped at 60).
export function createStopLayer(scene, stops) {
  const pickables = [];
  const entries = {};
  const personGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
  personGeo.translate(0, 2.5, 0);
  const tmp = new THREE.Object3D();

  for (const [id, s] of Object.entries(stops)) {
    const color = STOP_COLORS[id] ?? 0x334155;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 40, 10),
      new THREE.MeshLambertMaterial({ color: 0x334155 }),
    );
    pole.position.set(s.x, 20, s.z);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 14),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.25 }),
    );
    head.position.set(s.x, 46, s.z);
    head.userData.stopId = id;
    pole.userData.stopId = id;
    scene.add(pole, head);
    pickables.push(head, pole);

    const people = new THREE.InstancedMesh(
      personGeo,
      new THREE.MeshLambertMaterial({ color }),
      MAX_PEOPLE,
    );
    people.count = 0;
    scene.add(people);

    const label = makeLabel(`${s.name} · 0`, { bg: '#ffffff', fg: '#111827', scale: 1 });
    label.position.set(s.x, 72, s.z);
    scene.add(label);

    entries[id] = { people, label, last: -1, s };
  }

  function sync(sim) {
    for (const [id, e] of Object.entries(entries)) {
      const q = sim.stops[id].queue;
      if (q === e.last) continue;
      const n = Math.min(q, MAX_PEOPLE);
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / PER_ROW);
        const col = i % PER_ROW;
        tmp.position.set(e.s.x + 14 + col * SPACING, 0, e.s.z + 8 + row * SPACING);
        tmp.updateMatrix();
        e.people.setMatrixAt(i, tmp.matrix);
      }
      e.people.count = n;
      e.people.instanceMatrix.needsUpdate = true;
      e.label.userData.setText(`${e.s.name} · ${q} in line`);
      e.last = q;
    }
  }

  return { sync, pickables };
}
