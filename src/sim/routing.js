import { makePolyline } from './polyline.js';

const SNAP = 0.5; // metres: road vertices closer than this are one node
const SNAP_RADIUS = 150; // metres: how far a stop may be from the main road network

const keyOf = (x, z) => `${Math.round(x / SNAP)},${Math.round(z / SNAP)}`;

// Undirected road graph. nodes: [{x, z}], adj: [[{to, w}]], comp: component id per node.
export function buildGraph(roads) {
  const nodes = [];
  const adj = [];
  const index = new Map();
  const nodeId = (x, z) => {
    const k = keyOf(x, z);
    let id = index.get(k);
    if (id === undefined) {
      id = nodes.length;
      index.set(k, id);
      nodes.push({ x, z });
      adj.push([]);
    }
    return id;
  };
  for (const road of roads) {
    for (let i = 1; i < road.pts.length; i++) {
      const a = nodeId(...road.pts[i - 1]);
      const b = nodeId(...road.pts[i]);
      if (a === b) continue;
      const w = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
      adj[a].push({ to: b, w });
      adj[b].push({ to: a, w });
    }
  }

  // Connected components, so stops attach to the main network, not a stray driveway.
  const comp = new Array(nodes.length).fill(-1);
  const compSize = [];
  for (let s = 0; s < nodes.length; s++) {
    if (comp[s] !== -1) continue;
    const c = compSize.length;
    let size = 0;
    const stack = [s];
    comp[s] = c;
    while (stack.length) {
      const n = stack.pop();
      size++;
      for (const { to } of adj[n]) if (comp[to] === -1) { comp[to] = c; stack.push(to); }
    }
    compSize.push(size);
  }
  let main = 0;
  compSize.forEach((sz, c) => { if (sz > compSize[main]) main = c; });

  return { nodes, adj, comp, main };
}

function attach(graph, p) {
  let best = -1, bestD = Infinity, bestMain = -1, bestMainD = Infinity;
  graph.nodes.forEach((n, i) => {
    const d = Math.hypot(n.x - p.x, n.z - p.z);
    if (d < bestD) { bestD = d; best = i; }
    if (graph.comp[i] === graph.main && d < bestMainD) { bestMainD = d; bestMain = i; }
  });
  return bestMainD <= SNAP_RADIUS ? bestMain : best;
}

function dijkstra(graph, src, dst) {
  const n = graph.nodes.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  dist[src] = 0;
  for (;;) {
    let u = -1, du = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < du) { du = dist[i]; u = i; }
    if (u === -1 || u === dst) break;
    done[u] = 1;
    for (const { to, w } of graph.adj[u]) {
      if (du + w < dist[to]) { dist[to] = du + w; prev[to] = u; }
    }
  }
  if (dist[dst] === Infinity) return null;
  const path = [];
  for (let v = dst; v !== -1; v = prev[v]) path.push(v);
  return path.reverse();
}

// Shortest road path from `from` to `to` as [[x, z]]; straight line if unreachable.
export function route(graph, from, to) {
  if (graph.nodes.length === 0) return [[from.x, from.z], [to.x, to.z]];
  const ids = dijkstra(graph, attach(graph, from), attach(graph, to));
  if (!ids) return [[from.x, from.z], [to.x, to.z]];
  const pts = [[from.x, from.z], ...ids.map((i) => [graph.nodes[i].x, graph.nodes[i].z]), [to.x, to.z]];
  return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
}

export function buildRoutes(area) {
  const g = buildGraph(area.roads);
  const s = area.stops;
  const make = (a, b) => makePolyline(route(g, s[a], s[b]));
  return {
    lrt_apu: make('lrt', 'apu'),
    apu_lrt: make('apu', 'lrt'),
    parkhill_apu: make('parkhill', 'apu'),
    parkhill_lrt: make('parkhill', 'lrt'),
    apu_parkhill: make('apu', 'parkhill'),
  };
}
