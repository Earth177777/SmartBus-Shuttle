// Bake OpenStreetMap context for the whole shuttle network into src/data/area.json:
// highways across the network, local streets + buildings around APU and every stop.
// Run after `pnpm bake:routes`. Data © OpenStreetMap contributors, ODbL.
import { readFile, writeFile } from 'node:fs/promises';
import { project, ORIGIN } from '../src/geo.js';
import { STOPS } from '../src/data/lines.js';

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'smartshuttle-3d-bake/1.0';
const MAIN = 'motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link';
const LOCAL = 'residential|unclassified|living_street|service';
const MARGIN_DEG = 0.004; // ~450 m around the network
const LOCAL_RADIUS = { apu: 1100, other: 600 }; // metres of streets around each stop
const BUILDING_RADIUS = { apu: 900, other: 450 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (v) => Math.round(v * 10) / 10;

async function overpass(query) {
  for (let round = 0; round < 3; round++) {
    for (const url of MIRRORS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          signal: AbortSignal.timeout(120000),
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
        });
        const text = await res.text();
        if (res.ok && text.startsWith('{')) return JSON.parse(text);
        console.warn(`  ${new URL(url).host} busy (${res.status})`);
      } catch (err) {
        console.warn(`  ${new URL(url).host} ${String(err).slice(0, 50)}`);
      }
    }
    await sleep(5000);
  }
  throw new Error('All Overpass mirrors failed');
}

// Network bounds from the baked routes, so highways cover every bus path.
const routes = JSON.parse(await readFile(new URL('../src/data/routes.json', import.meta.url)));
let s = 90, n = -90, w = 180, e = -180;
const unproject = ([x, z]) => ({ lat: ORIGIN.lat - z / 110574, lon: ORIGIN.lon + x / (111320 * Math.cos((ORIGIN.lat * Math.PI) / 180)) });
for (const line of routes.lines) for (const leg of [...line.outbound, ...line.inbound]) for (const p of leg.pts) {
  const { lat, lon } = unproject(p);
  s = Math.min(s, lat); n = Math.max(n, lat); w = Math.min(w, lon); e = Math.max(e, lon);
}
const bbox = `${(s - MARGIN_DEG).toFixed(5)},${(w - MARGIN_DEG).toFixed(5)},${(n + MARGIN_DEG).toFixed(5)},${(e + MARGIN_DEG).toFixed(5)}`;
console.log('network bbox', bbox);

const around = (radius) => STOPS.map((st) => `(around:${st.id === 'apu' ? radius.apu : radius.other},${st.lat},${st.lon})`);
const query = `[out:json][timeout:180];
(
  way["highway"~"^(${MAIN})$"](${bbox});
  ${around(LOCAL_RADIUS).map((a) => `way["highway"~"^(${LOCAL})$"]${a};`).join('\n  ')}
  ${around(BUILDING_RADIUS).map((a) => `way["building"]${a};`).join('\n  ')}
);
out tags geom;`;

const data = await overpass(query);
const toPts = (geom) => geom.map((g) => { const p = project(g.lat, g.lon); return [r1(p.x), r1(p.z)]; });
function heightOf(tags, id) {
  const h = parseFloat(tags.height);
  if (Number.isFinite(h) && h > 0) return h;
  const lv = parseFloat(tags['building:levels']);
  if (Number.isFinite(lv) && lv > 0) return lv * 3.2;
  return 9 + (id % 7);
}

const seen = new Set();
const buildings = [];
const roads = [];
for (const el of data.elements) {
  if (el.type !== 'way' || !el.geometry || seen.has(el.id)) continue;
  seen.add(el.id);
  const t = el.tags || {};
  if (t.building) buildings.push({ pts: toPts(el.geometry), h: r1(heightOf(t, el.id)) });
  else if (t.highway && !(t.highway === 'service' && t.service === 'parking_aisle')) roads.push({ pts: toPts(el.geometry), kind: t.highway });
}

const out = { origin: ORIGIN, attribution: '© OpenStreetMap contributors (ODbL)', buildings, roads, stops: routes.stops };
const json = JSON.stringify(out);
await writeFile(new URL('../src/data/area.json', import.meta.url), json);
console.log(`buildings ${buildings.length}, roads ${roads.length}, ${(json.length / 1e6).toFixed(2)} MB`);
