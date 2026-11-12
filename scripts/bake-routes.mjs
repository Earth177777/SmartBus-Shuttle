// Bake real driving routes (one-way aware) from OSRM into src/data/routes.json.
// Route data © OpenStreetMap contributors (ODbL), routed by OSRM.
import { writeFile, mkdir } from 'node:fs/promises';
import { project } from '../src/geo.js';
import { STOPS, LINES } from '../src/data/lines.js';

const OSRM = 'https://router.project-osrm.org/route/v1/driving/';
const UA = 'smartshuttle-3d-bake/1.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (v) => Math.round(v * 10) / 10;
const stopById = Object.fromEntries(STOPS.map((s) => [s.id, s]));

async function osrm(points) {
  const coords = points.map((p) => `${p.lon},${p.lat}`).join(';');
  const url = `${OSRM}${coords}?overview=full&geometries=geojson&annotations=duration&steps=true&continue_straight=true`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const d = await res.json();
      if (d.code === 'Ok') return d.routes[0];
      throw new Error(`OSRM ${d.code} for ${coords}`);
    }
    await sleep(1500 * attempt);
  }
  throw new Error(`OSRM failed for ${coords}`);
}

// One leg from stop A to stop B (through optional via points), as projected points + free-flow seconds.
async function leg(fromId, toId, via) {
  const a = stopById[fromId];
  const b = stopById[toId];
  const route = await osrm([a, ...via, b]);
  await sleep(1100);
  const coords = route.geometry.coordinates;
  // Per-node durations across all sub-legs; sub-legs share their joining node.
  const durs = route.legs.flatMap((l) => l.annotation.duration);
  if (durs.length !== coords.length - 1) throw new Error(`annotation mismatch ${fromId}->${toId}`);
  const pts = coords.map(([lon, lat]) => { const p = project(lat, lon); return [r1(p.x), r1(p.z)]; });
  const times = [0];
  for (const d of durs) times.push(Math.round((times[times.length - 1] + d) * 10) / 10);
  const roads = [];
  for (const l of route.legs) for (const s of l.steps) if (s.name && roads[roads.length - 1] !== s.name) roads.push(s.name);
  return { from: fromId, to: toId, pts, times, distance: Math.round(route.distance), duration: Math.round(route.duration), roads };
}

const stops = {};
for (const s of STOPS) {
  const p = project(s.lat, s.lon);
  stops[s.id] = { x: r1(p.x), z: r1(p.z), name: s.name };
}

const lines = [];
for (const line of LINES) {
  const via = line.via ?? [];
  const chain = [...line.pickups, 'apu'];
  const outbound = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const isLast = i === chain.length - 2;
    outbound.push(await leg(chain[i], chain[i + 1], isLast ? via : []));
  }
  const back = [...chain].reverse();
  const inbound = [];
  for (let i = 0; i < back.length - 1; i++) {
    inbound.push(await leg(back[i], back[i + 1], i === 0 ? [...via].reverse() : []));
  }
  lines.push({ id: line.id, outbound, inbound });
  const fmt = (legs) => legs.map((l) => `${l.from}→${l.to} ${(l.distance / 1000).toFixed(1)} km ${Math.round(l.duration / 60)} min`).join(', ');
  console.log(`${line.id.padEnd(14)} out: ${fmt(outbound)}`);
  console.log(`${''.padEnd(14)} via: ${outbound.at(-1).roads.slice(0, 8).join(' → ')}`);
  console.log(`${''.padEnd(14)} back: ${fmt(inbound)}`);
}

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
const json = JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL), routes by OSRM', stops, lines });
await writeFile(new URL('../src/data/routes.json', import.meta.url), json);
console.log(`routes.json ${(json.length / 1e3).toFixed(0)} kB`);
