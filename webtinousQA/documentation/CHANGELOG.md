# Changelog

> **Webtinous · by Continous Group** — release-focused changes (MD.MD §9.2). Back to the [QA index](../README.md). Day-by-day progress is in the [UPDATELOG](UPDATELOG.md).

**No release has been published.** The version in `package.json` is **0.1.0**; there is no Git tag and no GitHub release (checked 2026-11-12). Everything below is **Unreleased** — built and tested on the `feat/3d-map` branch, not a shipped release. The first release needs an accepted major / minor / patch decision (MD.MD §9.1).

Format: [Keep a Changelog](https://keepachangelog.com/). Dates are `YYYY-MM-DD`.

## [Unreleased]

### Added

- **3D network map** (three.js) of APU, Bukit Jalil LRT, Parkhill and the other stops: real buildings and roads from OpenStreetMap, nine coloured routes, buses that grow with zoom, stop pins with a line of people showing the queue.
- **Nine real routes** — LRT, Parkhill, Fortune Park, City of Green, Maple, Kuchai Sentral, D'IVO, Bloomsvale/Harmony, M Vertica — routed on real roads with one-way streets (OSRM). The LRT bus runs via Jalan Barat onto the highway; the Parkhill bus leaves from its front gate.
- **APU's real weekday timetable** (Campus Connect V1_20261022) drives every trip, including the LRT continuous 7:30–8:45 pattern and "limited space" late trips.
- **Hourly traffic and peak-hour crowds**: a modelled Kuala Lumpur traffic profile slows buses in the rush; students reach stops in the 20 minutes before their trip.
- **Stop ETA screens and an APU departures board** (next bus, people in line, Ongoing / Waiting / Offline, extra-bus alerts); click an **In line** number to set the queue; click the map clock to change the time.
- **Crowd-aware dispatch**: a spare bus for lines longer than one bus; rerouting of buses with free seats through another route's crowded stop (both directions).
- **Logic tab**: the rules and the last decisions with their real numbers and which checks passed.
- **Analytics tab**: buses deployed now and at peak, average and longest wait, on-time trips, seats filled, riders by hour, per-route table.
- **Fleet optimizer** with a **max buses** cap and *Apply to routes*.
- **Impact tab — Today vs SmartShuttle**: the same simulated weekday with and without SmartShuttle; **one-click scenarios** (exam week, heavy rain, stadium event, LRT delay); a generated [impact report](../reports/impact-comparison.md) (`pnpm report:impact`).
- **Firebase tab**: documents in the team's BigQuery schema (`queue_events`, `ride_events`, `gps_events`, `trips`), the SQL behind each calculation, and Export JSON.
- **Edit tab**: change a route's times, buses and seats, or switch it off (saved in the browser).
- **Webcam stop box** (TensorFlow.js COCO-SSD, on-device counting) that feeds a stop's line.
- **Phone view** (`phone.html`) — an APSpace-style card that follows the demo live in the same browser, with a QR code; optional Firestore `live/state` sync when `VITE_FIREBASE_*` is set.
- **Guided tour** (driver.js) following the pitch deck and covering every feature; Hugeicons throughout.
- **GitHub Actions workflow** to publish the build to GitHub Pages (added by Herbert; **not yet working** — see [D-14](../decisions/README.md#d-14)).
- **Documentation**: root README with mind map, `webtinousQA/` workspace (standards, architecture, rules, data, developer guide, decisions, maps, evidence, reports), `.env.example`.

### Changed

- Simulation is driven by the published timetable instead of a mock one; travel times come from OSRM and are stretched by traffic and scenario.
- The pitch's slide-9 "smart stop at the LRT" is generalised into rerouting through any other route's crowded stop ([RULES R-10](RULES.md)).
- Production build is now multi-page (`index.html`, `phone.html`).

### Removed

- The first in-app road router (replaced by OSRM routes).
- "Ask SmartShuttle" (offline answers and optional Gemini) and the Firebase live-sync status card, including raw-event streaming to Firestore — removed at the team's request (see [D-11](../decisions/README.md)).

### Known limitations

- UniStay @ Kingston and Bayu Jalil are not mapped. Fleet sizes, traffic and crowd profiles are assumptions.
- The webcam stop box and Firebase live sync have **not** been verified on a real camera or a real Firebase project.
- The Webtinous footer/About credit and branded 404 required by DESIGN.MD are **not yet implemented** in the product UI.
- No licence has been chosen.

[Unreleased]: https://github.com/Earth177777/SmartBus-Shuttle/tree/feat/3d-map
