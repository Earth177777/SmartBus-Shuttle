# Verification record — 2026-11-12

> **Webtinous · by Continous Group** — sanitized check record. Back to the [QA index](../README.md).

**What this is:** what was actually checked, with results, and what was **not** run. A passing automated check supports only the behaviour it tests; it does not prove deployment, security or production readiness. Nothing here is a release gate — no release has been prepared.

**Source identity:** repository `Earth177777/SmartBus-Shuttle`, branch `feat/3d-map`, base commit `a0e339c`, plus the documentation changes made in the same task (committed afterwards; the documentation commit follows `a0e339c` on the branch).
**Environment:** macOS (Darwin 25.6), Node 25.6.0, pnpm 11.17.0, 2026-11-12 (+08). Browser checks used a built-in Browser pane against the Vite dev server (`localhost:5173`) and `vite preview` (`localhost:4173`).
**Owner / reviewer:** not assigned — the team has not named a reviewer.

## Results

| # | Check | Result | Scope and evidence | Limits |
| --- | --- | --- | --- | --- |
| 1 | `pnpm test` (Vitest) | **Passed** — 16 files, **102 tests** | Simulation, rules, routing data, telemetry, scenarios, comparison, optimizer, schedule, formatting, snapshot and camera-count logic. Command output observed 2026-11-12 (run again at the end of this task). | Pure-logic tests; **no tests exercise the 3D scene, the panel UI, the tour, popovers or `phone.html`**. |
| 2 | `pnpm build` | **Passed** | Produced `dist/index.html`, `dist/phone.html`, assets; main chunk ~1.9 MB (~528 kB gzip). | Build success is not a runtime check. Not deployed anywhere. |
| 3 | Secret scan of tracked and new files | **Passed** — no matches | Pattern search for key-, token- and private-key-like strings (`AIza…`, `sk-…`, `gho_…`, `ghp_…`, PEM headers, long values after `api_key`/`secret`/`token`/`password`), excluding the lockfile. `.env.example` holds placeholders only; real `.env*` files are git-ignored. | A pattern scan, not a full secret audit; git history before this task was scanned for the same patterns on tracked files only. |
| 4 | Mermaid syntax | **Passed** — 4 `.mmd` files + the README block parse (`mindmap`, `flowchart-v2` ×2, `er`) | Parsed with Mermaid 11 in an isolated scratch folder (not part of the project). | **Syntax only.** Not rendered on GitHub; visual layout and readability not reviewed. |
| 5 | Markdown links and anchors | **Passed** — 153 links, 39 anchors, 0 broken | A throwaway script (not committed) checked every relative link and `#anchor` in the 28 Markdown files outside `node_modules` (15 project docs + 13 standards), using GitHub's heading-slug rule. External URLs were **not** fetched. | External links, and GitHub's own rendering of anchors, not verified. |
| 6 | `pnpm report:impact` | **Passed** — file regenerated | [impact-comparison.md](../reports/impact-comparison.md) (Derived). | Simulated results. |
| 7 | Manual checks in the Browser pane (desktop viewport) | **Passed** for what was exercised | Map renders without console errors from the app; clock popover and queue popover set values; tabs Live / Impact / Logic / Analytics / Firebase / Edit render; scenario buttons; *Run comparison* and *Compare all days* produce results; optimizer with a max-bus cap; reroute triggered after setting a queue; route edit applied and reset; the guided tour opens and steps; production build served by `vite preview`; the phone feed received a snapshot over `BroadcastChannel`. | Manual, not repeatable as a test; **no screenshots retained**; one viewport size; headless/hidden-pane frame timing meant some checks used a debug `advance()` helper instead of real-time animation. |
| 8 | Camera card with camera blocked | **Passed** for the failure path | Card shows "Camera blocked — allow camera access for this page." and the app keeps working. | — |
| 9 | Webcam **person detection** | **Not run** | The Browser pane blocks the camera. | Needs a real laptop camera and internet (model download). |
| 10 | Firebase live sync (write and read) | **Not run** | No Firebase project configuration supplied; the Firestore emulator was not downloaded. The code path is unexercised. | Firestore security rules do not exist in the repository. |
| 11 | Phone-width layout of the current panel | **Not run** | Checked at 375 px on an **earlier** version of the panel only. | Re-check after the tabbed redesign. |
| 12 | Accessibility (keyboard, focus, contrast, screen reader) | **Not run** | — | Several controls are keyboard-reachable buttons/selects, but no review was done. |
| 13 | GitHub README rendering | **Not run** | — | Cannot claim a GitHub render was seen. |
| 14 | Pitch deck and portal submission readiness | **Not run** | Outside this repository. | See *Open* findings 5 and 11 in the [QA index](../README.md#current-findings-and-limits). |

**Link check result (check 5), 2026-11-12:** `checked 28 markdown files, 153 relative links, 0 problem(s)`. The first run found ten links to this record before it existed; they were fixed by writing it.

## Evidence labels used in the documentation

*Test-confirmed* claims in [RULES.md](../documentation/RULES.md) name the test files that passed in check 1. *Source-confirmed* claims were read in the code and were not necessarily executed. *Derived* values come from scripts (`pnpm bake*`, `pnpm report:impact`). *Not verified* items are listed in rows 9–14 above.
