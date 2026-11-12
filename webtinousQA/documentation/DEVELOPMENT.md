# Developer guide

> **Webtinous · by Continous Group** — documentation. Hand-maintained. **Read [`webtinousstandard.md`](../webtinousstandard.md) first** (mandatory starting order), then the [QA index](../README.md). Commands below were run on 2026-11-12 on macOS with Node 25.6 and pnpm 11.17 unless marked otherwise.

## Prerequisites

- **Node.js ≥ 20** and **pnpm** (`pnpm-lock.yaml` is the lockfile — do not mix in `npm install`).
- A modern browser with WebGL. The webcam stop box also needs a camera and internet (it downloads its model).
- `pnpm-workspace.yaml` lists packages whose install scripts are **declined** (`esbuild`, `@firebase/util`, `core-js`, `protobufjs`); pnpm 11 refuses to install until each is decided. Nothing in the app needs those scripts.

## Everyday commands

| Command | Where | What it does | Expected result |
| --- | --- | --- | --- |
| `pnpm install` | repo root | Install dependencies | "Done" with no `ERR_PNPM_IGNORED_BUILDS` |
| `pnpm dev` | repo root | Vite dev server | http://localhost:5173 (use `--port` / `--strictPort` to pin it) |
| `pnpm test` | repo root | Vitest, all tests | **16 test files, 102 tests passed** (2026-11-12) |
| `pnpm build` | repo root | Production build to `dist/` | `built in …`; `index.html` and `phone.html` plus assets. One large JS chunk (~1.9 MB, ~530 kB gzip) because three.js and the baked map are bundled |
| `pnpm preview` | repo root | Serve `dist/` | http://localhost:4173 |
| `pnpm bake:routes` | repo root, **internet** | Re-fetch real routes from OSRM into `src/data/routes.json` | Prints each route's roads and distance; ~1.1 s pause per request |
| `pnpm bake` | repo root, **internet** | Re-fetch map data from Overpass into `src/data/area.json` (run **after** `bake:routes`) | `buildings … roads … MB` |
| `pnpm report:impact` | repo root | Regenerate [`reports/impact-comparison.md`](../reports/impact-comparison.md) | File rewritten; first rows printed |

## Layout

```text
src/sim/      simulation and rules (pure JS, unit-tested)
src/scene/    three.js map, buses, stops
src/ui/       panel, tabs, popovers, tour, camera, icons
src/live/     snapshot, same-browser channel, optional Firebase sync
src/data/     lines.js (hand-maintained) and baked routes.json / area.json
scripts/      bake and report generators (run by developers)
tests/        Vitest tests (simulation, rules, data, formatting)
webtinousQA/  standards, documentation, decisions, maps, reports, evidence
docs/         original design and plan (history)
```

## Working agreements

- **Test first for behaviour:** simulation rules have tests; add or update one before changing a rule, then run `pnpm test` (the whole suite, not one file).
- **Change a route or timetable:** edit `src/data/lines.js`; if stops or roads changed, run `pnpm bake:routes` then `pnpm bake`; run `pnpm test` (it checks the Parkhill front-gate and LRT-via-Jalan-Barat roads in `tests/routes-data.test.js`).
- **Change a number in the rules** ([RULES.md](RULES.md)): update the code, its test, and this documentation together; regenerate the impact report.
- **Docs:** keep [CHANGELOG](CHANGELOG.md) (*Unreleased*) and [UPDATELOG](UPDATELOG.md) current; record material choices in [decisions](../decisions/README.md).
- **Git:** work on a branch; do not merge to `main` without the team's agreement. No secrets in commits — real `.env*` files are git-ignored; commit only [`.env.example`](../../.env.example).
- **Icons:** Hugeicons (free set) via `src/ui/icons.js`; no emoji in the UI.

## Optional Firebase

Copy [`.env.example`](../../.env.example) to `.env.local`, fill in the web app config from your Firebase console, restart `pnpm dev`. **Configure Firestore security rules before using a real project** — none are provided here. The live-sync path has not been tested against Firestore or its emulator (see [evidence](../evidence/verification-2026-11-12.md)).

## Known gaps a developer should know

See [Current findings and limits](../README.md#current-findings-and-limits).
