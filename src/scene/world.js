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
};

const ROAD_WIDTH = {
  motorway: 16, trunk: 14, primary: 12, secondary: 10, tertiary: 8,
  motorway_link: 8, trunk_link: 8, primary_link: 7, secondary_link: 7, tertiary_link: 6,
  residential: 6, unclassified: 6, living_street: 5, service: 4,
};
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary']);
const CAMPUS_RADIUS = 260; // metres around APU tinted as campus
const DESKTOP_MIN_WIDTH = 768; // matches the CSS breakpoint for the side panel
const PANEL_WIDTH = 416; // panel 400 px + 16 px gutter
const MOBILE_SHEET_SHARE = 0.48; // matches .panel max-height on phones
const ROUTE_WIDTH = { out: 16, back: 7 };
const ROAD_Y = { minor: 0.3, major: 0.6 };
const ROUTE_Y = { base: 1.5, step: 0.8 };

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
    .map((r) => ribbonGeometry(r.pts, ROAD_WIDTH[r.kind] ?? 5, major ? ROAD_Y.major : ROAD_Y.minor));
  if (!parts.length) return null;
  return new THREE.Mesh(
    mergeGeometries(parts, false),
    new THREE.MeshLambertMaterial({ color: major ? COLORS.majorRoad : COLORS.road }),
  );
}

// Solid (not transparent): overlapping transparent ribbons re-sort as the camera moves and flicker.
export function routeLine(polyline, color, y = 1, width = 4) {
  return new THREE.Mesh(ribbonGeometry(polyline.pts, width, y), new THREE.MeshBasicMaterial({ color }));
}

// lines: [{ color: '#rrggbb', out: [[x, z]...][], back: [[x, z]...][] }]
export function createWorld(container, area, lines) {
  // Log depth: the scene spans ~10 km, so close-together layers (roads, routes) would z-fight.
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, 9000, 20000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c0c8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-600, 900, 400);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40000, 40000),
    new THREE.MeshLambertMaterial({ color: COLORS.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  scene.add(buildingsMesh(area.buildings));
  for (const major of [false, true]) {
    const m = roadsMesh(area.roads, major);
    if (m) scene.add(m);
  }
  // Each route: trips to APU drawn wide, trips home thinner on top (they often share roads).
  const lineGroups = {};
  lines.forEach((line, i) => {
    // Each route gets its own clear height so shared roads never fight for the same pixels.
    const y = ROUTE_Y.base + i * ROUTE_Y.step;
    const group = new THREE.Group();
    for (const pts of line.out) group.add(routeLine({ pts }, line.color, y, ROUTE_WIDTH.out));
    for (const pts of line.back) group.add(routeLine({ pts }, line.color, y + ROUTE_Y.step / 2, ROUTE_WIDTH.back));
    lineGroups[line.id] = group;
    scene.add(group);
  });

  // Frame every stop.
  const stops = Object.values(area.stops);
  const xs = stops.map((p) => p.x), zs = stops.map((p) => p.z);
  const center = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(40, aspect, 5, 40000);
  // Narrow (portrait) screens see less sideways, so start further back.
  const back = Math.min(Math.max(Math.pow(aspect, -0.8), 1), 2.2);
  const dist = span * 1.35 * back;
  camera.position.set(center.x + dist * 0.08, dist * 0.78, center.z + dist * 0.72);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.maxPolarAngle = 1.35;
  controls.minDistance = 120;
  controls.maxDistance = 30000;
  controls.update();
  const home = { target: center.clone(), position: camera.position.clone() };

  // Glide to (x, z); optionally zoom so the camera ends `distance` metres from it.
  let focusGoal = null;
  function focus(x, z, distance = null) {
    focusGoal = { target: new THREE.Vector3(x, 0, z), distance };
  }
  function overview() {
    focusGoal = { target: home.target.clone(), distance: home.position.distanceTo(home.target) };
  }
  function update() {
    if (focusGoal) {
      const delta = focusGoal.target.clone().sub(controls.target).multiplyScalar(0.12);
      controls.target.add(delta);
      camera.position.add(delta);
      let zoomDone = true;
      if (focusGoal.distance) {
        const offset = camera.position.clone().sub(controls.target);
        const d = offset.length();
        const next = d + (focusGoal.distance - d) * 0.12;
        camera.position.copy(controls.target).add(offset.setLength(next));
        zoomDone = Math.abs(next - focusGoal.distance) < 2;
      }
      if (delta.length() < 0.5 && zoomDone) focusGoal = null;
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

  function setLineVisible(id, visible) {
    if (lineGroups[id]) lineGroups[id].visible = visible;
  }

  return { scene, camera, renderer, controls, focus, overview, update, resize, setLineVisible };
}
