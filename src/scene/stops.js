import * as THREE from 'three';
import { makeLabel } from './label.js';

const MAX_PEOPLE = 60;
const PER_ROW = 10;
const SPACING = 4.5;
const APU_COLOR = '#0f766e';
const PIN_GROWTH = 1 / 1200; // pins grow with camera distance so far stops stay visible

// stopColors: { stopId: '#rrggbb' }. queueOf(sim, stopId) -> people waiting there.
export function createStopLayer(scene, stops, stopColors, queueOf) {
  const pickables = [];
  const entries = {};
  const personGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
  personGeo.translate(0, 2.5, 0);
  const tmp = new THREE.Object3D();

  for (const [id, s] of Object.entries(stops)) {
    const color = id === 'apu' ? APU_COLOR : stopColors[id] ?? '#334155';
    const pin = new THREE.Group();
    pin.position.set(s.x, 0, s.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 10), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    pole.position.y = 20;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 14),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.25 }),
    );
    head.position.y = 46;
    head.userData.stopId = id;
    pole.userData.stopId = id;
    pin.add(pole, head);
    scene.add(pin);
    pickables.push(head, pole);

    const people = new THREE.InstancedMesh(personGeo, new THREE.MeshLambertMaterial({ color }), MAX_PEOPLE);
    people.count = 0;
    scene.add(people);

    const label = makeLabel(`${s.name} · 0`, { bg: '#ffffff', fg: '#111827', scale: id === 'apu' ? 0.85 : 0.7 });
    label.position.set(0, 64, 0);
    pin.add(label);

    entries[id] = { pin, people, label, last: -1, s };
  }

  function sync(sim, camera) {
    for (const [id, e] of Object.entries(entries)) {
      if (camera) {
        const k = Math.max(1, camera.position.distanceTo(e.pin.position) * PIN_GROWTH);
        e.pin.scale.set(k, k, k);
        e.label.userData.setParentScale(k);
      }
      const q = queueOf(sim, id);
      if (q === e.last) continue;
      const n = Math.min(q, MAX_PEOPLE);
      for (let i = 0; i < n; i++) {
        tmp.position.set(e.s.x + 14 + (i % PER_ROW) * SPACING, 0, e.s.z + 8 + Math.floor(i / PER_ROW) * SPACING);
        tmp.updateMatrix();
        e.people.setMatrixAt(i, tmp.matrix);
      }
      e.people.count = n;
      e.people.instanceMatrix.needsUpdate = true;
      e.label.userData.setText(`${e.s.name} · ${q} waiting`);
      e.last = q;
    }
  }

  return { sync, pickables };
}
