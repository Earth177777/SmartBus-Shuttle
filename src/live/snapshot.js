// A plain-JSON picture of every stop screen and the APU board, for the phone card
// (same browser via BroadcastChannel) and Firebase (live/state document).
import { stopScreen, departuresBoard, simTraffic } from '../sim/sim.js';

export function buildSnapshot(sim, lines, stops) {
  const out = { clock: sim.clock, running: sim.running, scenario: sim.scenario.id, traffic: +simTraffic(sim, sim.clock).toFixed(2), stops: {}, board: [] };
  for (const l of lines) {
    if (!sim.lines[l.id]) continue;
    for (const id of l.pickups) {
      const s = stopScreen(sim, id);
      out.stops[id] = {
        name: stops[id].name, line: l.id, code: l.code, color: l.color, capacity: l.capacity,
        nextTime: s.nextTime, nextBusMin: s.nextBusMin, inLine: s.inLine, status: s.status, alert: s.alert ?? null, late: !!s.late,
      };
    }
  }
  out.board = departuresBoard(sim).map((s) => {
    const l = lines.find((x) => x.id === s.lineId);
    return { line: s.lineId, code: l.code, name: l.name, color: l.color, nextTime: s.nextTime, nextBusMin: s.nextBusMin, inLine: s.inLine, status: s.status, alert: s.alert ?? null };
  });
  return JSON.parse(JSON.stringify(out));
}
