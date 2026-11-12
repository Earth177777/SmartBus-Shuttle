# SmartShuttle 3D Map + Mock Buses — Design

> **Status: historical record (2026-11-12).** This is the original design approved before building. It has been **superseded in part** — see [D-03 to D-08 and D-11](../../../webtinousQA/decisions/README.md) (real OSRM routes, APU's real timetable, nine routes instead of three, generalised rerouting, new tabs and features). **Current behaviour is documented in** [RULES.md](../../../webtinousQA/documentation/RULES.md), [ARCHITECTURE.md](../../../webtinousQA/documentation/ARCHITECTURE.md) and the [QA index](../../../webtinousQA/README.md). The original text below is unchanged.

Approved by Gilbert, 12 Nov 2026.

## Intent
A deployable web demo for the APU Cloud Innovation Hackathon (submission 13 Nov 2026 12:00 MYT, demo 17 Nov). Judges open one link and see SmartShuttle working: a 3D map of the real area around APU with mock buses driving real roads, live queues at stops, and the stop/ETA screen from the pitch deck (slide 7). It replaces the broken Netlify prototype as the "deployed website demo URL".

## Goals
- 3D map of the real streets and buildings around APU, Bukit Jalil LRT and Parkhill, built from OpenStreetMap.
- Mock buses following real road paths on a timetable:
  - LRT Bukit Jalil ↔ APU loop (free route).
  - Parkhill → APU, with the pitch's "smart stop" rule at the LRT: stop only if LRT queue > seats on the next LRT bus AND this bus has free seats AND the new ETA ≤ the buffered promised ETA.
- Queues that grow at stops over time; each bus shows its load.
- Crowd dispatch: when the LRT queue exceeds one bus's capacity, a second bus is called (alert shown, as on slide 7).
- Side panel = stop screen for the selected stop: next bus, ETA, in line, status (Ongoing / Waiting / Offline).
- Speed control (1×, 10×, 60×) and a clock, so a full rush hour plays in about a minute.
- Orbit/zoom camera; click a stop or bus to focus it.

## Non-goals (for now)
Face check-in, APSpace connection, Firebase/BigQuery writes, real GPS/IoT, routes beyond LRT/Parkhill/APU.

## Anti-goals
- The demo link must not depend on a login, API key, or live backend that can break before judging.
- Must load fast on a normal laptop: no huge downloads, no photorealistic tiles.

## Constraints
- Static site; runs fully in the browser.
- OSM data baked into the project once (ODbL attribution shown on screen).
- Lives in this folder; later pushed to github.com/Earth177777/SmartBus-Shuttle on a branch, never main (only when the user asks).

## Approaches
1. **three.js + baked OSM geometry (chosen).** Clean stylized look that matches the pitch deck, no key, small download, full control over drawing routes and buses.
2. Google Photorealistic 3D Tiles. Most impressive and counts as a Google service, but needs a billed Maps API key, is heavy, and makes clean route overlays hard. Rejected for demo reliability.
3. Mapbox/MapLibre 3D extrusions. Easy map, but needs a tile source or key and offers less control over the scene. Not needed.

## Builder's calls
- Vite + three.js (+ OrbitControls). Plain TypeScript-free JS modules.
- A Node script fetches OSM buildings and roads for the bbox via Overpass and writes a compact JSON (local metres, origin at APU). Bus paths come from OSM road geometry (shortest path over the road graph between stops); if routing fails, use hand-traced waypoint polylines.
- Building height = OSM height, else levels × 3.2 m, else a default of 9–15 m.
- Bus capacity 40 (tunable). Arrival rates per stop vary by simulated hour to create a rush peak.
- Deploy target: Firebase Hosting or GitHub Pages (decided when deploying).
