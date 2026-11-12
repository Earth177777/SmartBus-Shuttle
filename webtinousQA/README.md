# SmartShuttle — QA and documentation index

> **WEBTINOUS · BY CONTINOUS GROUP** — project documentation workspace under Project Standards v6.0.0.
> This index is **not** the product README. The public front page is the repository [README.md](../README.md); this folder holds the working records behind it.

**Product:** SmartShuttle — a simulated, crowd-aware shuttle network for APU (hackathon prototype, version **0.1.0, unreleased**).
**Owners:** team Buset — Gilbert, Herbert Valentino, Louis, Nicholas. **Status:** prototype; simulated data only; not a production system. **Source scope of these records:** branch `feat/3d-map`, as of 2026-11-12.

## Start here (mandatory order)

1. Read **[webtinousstandard.md](webtinousstandard.md)** — the entry point and directory of all standards (canonical copy for this repository).
2. Read **[SOFTWARE.MD](standards/SOFTWARE.MD)**, then the modules for your task (route table in the starting guide §3).
3. Read the [decisions](decisions/README.md), the [UPDATELOG](documentation/UPDATELOG.md) and the *Current findings* below, then inspect the real code before trusting any document.

**What was actually read when these records were produced (2026-11-12):** `webtinousstandard.md`, `SOFTWARE.MD`, `MD.MD`, `DESIGN.MD` (identity, attribution and Part E) and `MAPPING.MD` (notation and evidence labels). `REQUIREMENTS.MD`, `TESTING.MD`, `CIA.MD`, `BUILD.MD`, `OPERATIONS.MD`, `MAINTENANCE.MD`, `HARDWARE.MD`, `MOTIONVIDEO.MD` and `CONTINUOUS.MD` are copied into [standards/](standards/) but were **not** read in full for this work. No release, deployment or operations work was done.

## Index

| Record | What it covers | Source / version | Limits |
| --- | --- | --- | --- |
| [../README.md](../README.md) | Public front page: identity, functions, quick start, usage, rights, workflow mind map | Repository root, 0.1.0 unreleased | Mermaid block not render-checked on GitHub |
| [standards/](standards/) | The 13 adopted Webtinous standard modules | v6.0.0 (2026-11-04), copied unchanged from the team's shared `WebtinousQA` folder | Reusable standards, not project evidence |
| [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) | Components, data ownership, trust boundaries, failure behaviour, component map | Code at the evidence revision | Hand-maintained |
| [documentation/RULES.md](documentation/RULES.md) | Business rules R-01…R-18 with formulas, scenarios, assumptions, what is *not* built | Code at the evidence revision | Assumptions are labelled; hand-maintained |
| [documentation/DATA.md](documentation/DATA.md) | Baked files, simulation state, telemetry schema (Crow's Foot), storage keys | Code and baked data | BigQuery schema is documented intent |
| [documentation/DEVELOPMENT.md](documentation/DEVELOPMENT.md) | Setup, commands, layout, working agreements | Run 2026-11-12, Node 25.6 / pnpm 11.17 | macOS only |
| [documentation/CHANGELOG.md](documentation/CHANGELOG.md) | Release-focused changes — everything is *Unreleased* | 0.1.0 (no tag, no release) | — |
| [documentation/UPDATELOG.md](documentation/UPDATELOG.md) | Dated progress, checks, next actions | 2026-11-07 → 2026-11-12 | — |
| [decisions/README.md](decisions/README.md) | Accepted choices D-01…D-12, open decision D-13 | — | — |
| [maps/README.md](maps/README.md) | Mind map, component map, Crow's Foot data model, decision flow (Mermaid sources) | Evidence revision | Syntax parsed, not GitHub-rendered |
| [reports/impact-comparison.md](reports/impact-comparison.md) | **Generated** — APU today vs SmartShuttle for five scenarios | Commit named in the file; `pnpm report:impact` | Simulated results |
| [evidence/verification-2026-11-12.md](evidence/verification-2026-11-12.md) | What was checked, with results and what was **not** run | Evidence revision | Manual browser checks leave no screenshots |
| [../docs/superpowers/](../docs/superpowers/) | Original design and plan — **historical**; kept in place and linked | 2026-11-12 | Superseded in part (see their status notes) |
| [../.env.example](../.env.example) | Sanitized configuration template (Firebase names, placeholders only) | — | — |

No `notes/`, `assets/` or release-report folders exist: no working notes beyond the logs, no screenshots were kept, and no release has been prepared.

## Current findings and limits

Statuses: **Open**, **Accepted limit**, **Blocked**. Evidence labels as in [ARCHITECTURE.md](documentation/ARCHITECTURE.md).

| # | Finding | Status |
| --- | --- | --- |
| 1 | **Webtinous identity not in the product UI.** DESIGN.MD Part E requires the Webtinous · by Continous Group credit (footer/About) and, for routed web products, the branded 404. The app has neither. It has no client-side routing, so a missing path would show the host's default 404. Documentation carries the credit. | **Open** — implement before treating the product as conforming |
| 2 | **Webcam stop box unverified.** Counting logic is tested; detection was never run on a real camera (blocked in the Browser pane). It needs internet to fetch its model. | **Open** — test on a laptop |
| 3 | **Firebase live sync unverified.** No project config and no emulator run. **No Firestore security rules exist in the repository** — add and review them before connecting a real project. | **Open** |
| 4 | **GitHub rendering not checked.** README/Mermaid blocks were syntax-parsed only; links were checked by script (see the evidence record). | **Open** |
| 5 | **Pitch deck is out of date:** slide 9 describes the LRT smart stop (no longer used); "[Ayden]" should be Nicholas; the LRT's real road route (~4 km) is longer than the slide's straight-line 1.0 km. | **Open** — before the portal submission |
| 6 | **Not mapped:** UniStay @ Kingston and Bayu Jalil (on APU's timetable; not found in OpenStreetMap). | **Accepted limit** |
| 7 | **Modelled data:** traffic, crowds, scenario factors, fleet sizes, the LRT 6-minute continuous interval. Results are illustrative. | **Accepted limit** (labelled in the app and docs) |
| 8 | **Schema mismatch to confirm:** the simulation writes `route_id` on `queue_events`, which the team's BigQuery table (per 2026-11-10 screenshots) does not list; the real dataset was not inspected. | **Open** |
| 9 | **Licence not chosen** ([D-13](decisions/README.md#d-13)). | **Open** |
| 10 | **Layout and accessibility not re-checked** since the tabbed panel: phone-width layout was checked on an earlier version only; no keyboard, contrast or screen-reader review was done. | **Open** |
| 11 | **Repository is private** with `feat/3d-map` as its only (default) branch; no `main`, tag or release. The portal needs reviewer access or a public repo. | **Open** |
