import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const COLORS = {
  sky: 0xeef2f6,
  ground: 0xe4e8e1,
  building: 0xd9dde3,
  campus: 0x9fd3c7,
  road: 0xc3c9d2,
  majorRoad: 0xaab2bd,
  lrt: 0x2563eb,
  parkhill: 0xf59e0b,
  extra: 0x8b5cf6,
};

const ROAD_WIDTH = {
  motorway: 16, trunk: 14, primary: 12, secondary: 10, tertiary: 8,
  motorway_link: 8, trunk_link: 8, primary_link: 7, secondary_link: 7, tertiary_link: 6,
  residential: 6, unclassified: 6, living_street: 5, service: 4,
};
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary']);
const CAMPUS_RADIUS = 260; // metres around APU tinted as campus
const DESKTOP_MIN_WIDTH = 768; // matches the CSS breakpoint for the side panel
const PANEL_WIDTH = 376; // panel 360 px + 16 px gutter
const MOBILE_SHEET_SHARE = 0.48; // matches .panel max-height on phones

// Flat ribbon along a polyline at height y.
export function ribbonGeometry(pts, width, y) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const [ax, az] = pts[Math.max(i - 1, 0)];
    const [bx, bz] = pts[Math.min(i + 1, pts.length - 1)];
    let dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const nx = -dz * (width / 2), nz = dx * (width / 2);
    pos.push(x + nx, y, z + nz, x - nx, y, z - nz);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildingsMesh(buildings) {
  const parts = [];
  const campus = new THREE.Color(COLORS.campus);
  const plain = new THREE.Color(COLORS.building);
  for (const b of buildings) {
    if (b.pts.length < 4) continue;
    const shape = new THREE.Shape(b.pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: b.h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    const [cx, cz] = b.pts[0];
    const c = Math.hypot(cx, cz) < CAMPUS_RADIUS ? campus : plain;
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g.index ? g.toNonIndexed() : g);
  }
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ vertexColors: true }));
  return mesh;
}

function roadsMesh(roads, major) {
  const parts = roads
    .filter((r) => MAJOR.has(r.kind) === major && r.pts.length > 1)
    .map((r) => ribbonGeometry(r.pts, ROAD_WIDTH[r.kind] ?? 5, major ? 0.12 : 0.08));
  if (!parts.length) return null;
  return new THREE.Mesh(
    mergeGeometries(parts, false),
    new THREE.MeshLambertMaterial({ color: major ? COLORS.majorRoad : COLORS.road }),
  );
}

export function routeLine(polyline, color, y = 0.4, width = 4) {
  return new THREE.Mesh(
    ribbonGeometry(polyline.pts, width, y),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
  );
}

export function createWorld(container, area, routes) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, 3000, 6500);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c0c8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-600, 900, 400);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshLambertMaterial({ color: COLORS.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  scene.add(buildingsMesh(area.buildings));
  for (const major of [false, true]) {
    const m = roadsMesh(area.roads, major);
    if (m) scene.add(m);
  }
  scene.add(routeLine(routes.lrt_apu, COLORS.lrt, 0.45, 9));
  scene.add(routeLine(routes.parkhill_apu, COLORS.parkhill, 0.55, 7));
  scene.add(routeLine(routes.parkhill_lrt, COLORS.parkhill, 0.6, 4));

  const s = area.stops;
  // Frame the midpoint between the LRT and APU (routes loop east of APU, so lean right).
  const center = new THREE.Vector3((s.apu.x + s.lrt.x) / 2 + 200, 0, (s.apu.z + s.lrt.z) / 2 + 40);
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(40, aspect, 5, 12000);
  // Narrow (portrait) screens see less sideways, so start further back.
  const back = Math.min(Math.max(Math.pow(aspect, -0.8), 1), 2.2);
  camera.position.set(center.x + 140 * back, 1700 * back, center.z + 1550 * back);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.maxPolarAngle = 1.35;
  controls.minDistance = 120;
  controls.maxDistance = 5000;
  controls.update();

  let focusTarget = null;
  function focus(x, z) {
    focusTarget = new THREE.Vector3(x, 0, z);
  }
  function update() {
    if (focusTarget) {
      const delta = focusTarget.clone().sub(controls.target).multiplyScalar(0.12);
      controls.target.add(delta);
      camera.position.add(delta);
      if (delta.length() < 0.5) focusTarget = null;
    }
    controls.update();
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    // On desktop the panel covers the right side: shift the view so the map's
    // centre sits in the visible area left of it.
    // On phones the bottom sheet covers the lower ~half: shift the view up instead.
    if (w >= DESKTOP_MIN_WIDTH) camera.setViewOffset(w, h, PANEL_WIDTH / 2, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * MOBILE_SHEET_SHARE / 2, w, h);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  return { scene, camera, renderer, controls, focus, update, resize };
}
