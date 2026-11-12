# Update log

> **Webtinous · by Continous Group** — how the project and its documentation progressed (MD.MD §9.3). Back to the [QA index](../README.md). Released product changes are in the [CHANGELOG](CHANGELOG.md).

Newest first. **Status** words are used only where evidence exists (see the [evidence record](../evidence/verification-2026-11-12.md)). Times are Malaysia time (UTC+8) where given. A log entry is not approval or test evidence by itself.

## 2026-11-12

### Deployment workflow added by Herbert — Implemented, **blocked**

- **What:** commit `0ed77ff` adds `.github/workflows/deploy.yml` (build with pnpm 9 / Node 20, publish `dist/` to GitHub Pages on each push to `feat/3d-map`) — [D-14](../decisions/README.md#d-14).
- **Observed (2026-11-12, via the GitHub API):** run 1 `startup_failure`; run 2 (after the documentation push) failed — annotation: *"The job was not started because your account is locked due to a billing issue."* No Pages site configured (404); repository public. Every push to the branch triggers a run, so each will fail until the lock is cleared.
- **Next:** the account owner resolves the billing lock; then enable Pages (source: GitHub Actions), re-run, and record the live URL and whether the build passes under pnpm 9. Fallback: deploy to Firebase Hosting or Netlify.

### Documentation updated to the Webtinous standard — Implemented (checks partly run)

- **Task / outcome:** Apply MD.MD v6.0.0: root README with mind map, `webtinousQA/` workspace (standards copied from the shared `WebtinousQA` folder, index, architecture, rules, data, developer guide, decisions, maps, evidence, generated impact report), CHANGELOG and this log. Old design/plan marked as historical.
- **Affected:** `README.md`, `webtinousQA/**`, `docs/superpowers/**` (status notes only), `.env.example`, `.gitignore`, `scripts/impact-report.mjs`, `package.json` (`report:impact` script).
- **Decisions:** [D-09](../decisions/README.md#d-09) (Crow's Foot instead of Chen), [D-10](../decisions/README.md#d-10) (Mermaid), [D-12](../decisions/README.md#d-12), [D-13 open](../decisions/README.md#d-13).
- **Checks:** `pnpm test` → 102 passed; `pnpm build` → ok; four Mermaid diagrams + README block **parsed** OK (Mermaid 11); relative links and anchors checked by script (28 Markdown files, 158 relative links, 0 problems). **Not run:** GitHub render check, real-camera and Firebase checks.
- **Blockers / limits:** the product UI still lacks the Webtinous credit and branded 404 (DESIGN.MD Part E) — recorded in the QA index.
- **Next:** see *Next useful actions* below.

### Features built and pushed — Verified for the simulation; not verified for camera and Firebase

- **Done:** 3D map; nine real routes (OSRM); APU's real timetable; traffic and peak-hour crowds; stop screens and board; extra buses and rerouting; Logic, Analytics, Firebase, Impact, Edit tabs; fleet optimizer with max-bus cap; scenarios; webcam stop box; phone view; guided tour; Hugeicons. "Ask SmartShuttle" and the live-sync card were added and then removed at the team's request ([D-11](../decisions/README.md#d-11)).
- **Corrections from the team during the day:** Parkhill uses its front gate; the LRT goes via Jalan Barat/Endah onto the highway; the clock moved to the top-right of the map ([D-05](../decisions/README.md#d-05)).
- **Checks:** automated tests grew from 3 to 102 across 16 files and all passed on the last run; behaviours were also exercised by hand in the browser pane (clock, queue editing, tabs, scenarios, comparison, tour, camera card). The camera is blocked in that pane, so detection was **not** exercised.
- **Pushed:** branch `feat/3d-map` to `Earth177777/SmartBus-Shuttle` — [D-12](../decisions/README.md#d-12). The repository was later made **public** (observed 2026-11-12).

### Plan and design — Implemented

- Approved design and a 6-task plan written and executed task by task (kept as history in [`docs/superpowers/`](../../docs/superpowers/)); every task ended with a passing test run.

## 2026-11-07 → 2026-11-10 (before this repository)

- *Source: the team's chat and pitch PDF — documented intent, not code.* 2026-11-07: team "Buset" formed (Gilbert, Herbert Valentino, Louis, Nicholas); idea chosen (Problem 01 · Smart Campus; value for Problem 03); 13-slide pitch drafted. 2026-11-08: team registered on the hackathon portal; APSpace connection agreed as a revision. 2026-11-09/10: Herbert's Netlify prototype (Firebase queue + boarding + dashboard); BigQuery dataset `smartshuttle` with six tables and ER diagram created; GitHub repository created and left empty.

## Next useful actions

1. **Before 2026-11-13 12:00 MYT (portal deadline):** get the Pages deployment working (a public demo URL), replace "[Ayden]" in the pitch PDF, update slide 9 (no LRT stop for Parkhill).
2. Test the webcam stop box on a laptop; connect a Firebase project (with Firestore rules) and test the phone view on a phone or the emulator.
3. Add the Webtinous footer/About credit (and a branded 404 if routing is added) to the product UI.
4. Choose a licence ([D-13](../decisions/README.md#d-13)); map UniStay @ Kingston and Bayu Jalil; replace modelled crowds with real stop-box counts when available.
