// One-off: bake OpenStreetMap buildings + roads around APU into src/data/area.json.
// Data © OpenStreetMap contributors, ODbL.
import { writeFile, mkdir } from 'node:fs/promises';
import { project, ORIGIN } from '../src/geo.js';

const BBOX = { s: 3.05, w: 101.688, n: 3.062, e: 101.705 };
const STOPS = {
  apu: { lat: 3.0553, lon: 101.7006, name: 'APU Campus' },
  lrt: { lat: 3.0583, lon: 101.6922, name: 'LRT Bukit Jalil' },
  parkhill: { lat: 3.0561, lon: 101.6957, name: 'Parkhill Residence' },
};
const ROAD_KINDS = new Set([
  'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
  'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
  'residential', 'unclassified', 'living_street', 'service',
]);
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'smartshuttle-3d-bake/1.0';

async function overpass(query) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const r1 = (v) => Math.round(v * 10) / 10;
const toPts = (geom) => geom.map((g) => { const p = project(g.lat, g.lon); return [r1(p.x), r1(p.z)]; });

function heightOf(tags, id) {
  const h = parseFloat(tags.height);
  if (Number.isFinite(h) && h > 0) return h;
  const lv = parseFloat(tags['building:levels']);
  if (Number.isFinite(lv) && lv > 0) return lv * 3.2;
  return 9 + (id % 7); // deterministic 9–15 m
}

const b = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
const data = await overpass(`[out:json][timeout:60];(way["building"](${b});way["highway"](${b}););out tags geom;`);

const buildings = [];
const roads = [];
for (const el of data.elements) {
  if (el.type !== 'way' || !el.geometry) continue;
  const t = el.tags || {};
  if (t.building) {
    buildings.push({ pts: toPts(el.geometry), h: r1(heightOf(t, el.id)) });
  } else if (ROAD_KINDS.has(t.highway)) {
    if (t.highway === 'service' && t.service && t.service !== 'driveway') continue;
    roads.push({ pts: toPts(el.geometry), kind: t.highway, ...(t.oneway === 'yes' ? { oneway: true } : {}) });
  }
}

// Sanity check: nearest named feature to each stop.
const stops = {};
for (const [id, s] of Object.entries(STOPS)) {
  const p = project(s.lat, s.lon);
  stops[id] = { x: r1(p.x), z: r1(p.z), name: s.name };
  const near = await overpass(`[out:json][timeout:25];nwr(around:150,${s.lat},${s.lon})["name"];out tags center 5;`);
  const names = near.elements.map((e) => e.tags.name).slice(0, 5).join(' | ');
  console.log(`${id.padEnd(9)} (${stops[id].x}, ${stops[id].z})  near: ${names || '(none)'}`);
}

const out = { origin: ORIGIN, attribution: '© OpenStreetMap contributors (ODbL)', buildings, roads, stops };
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
const json = JSON.stringify(out);
await writeFile(new URL('../src/data/area.json', import.meta.url), json);
console.log(`buildings ${buildings.length}, roads ${roads.length}, ${(json.length / 1e6).toFixed(2)} MB`);
