# Decision record

> **Webtinous · by Continous Group** — accepted choices, assumptions and open decisions for SmartShuttle. Back to the [QA index](../README.md).

Each entry: **context → accepted option → rationale → alternatives → consequences → status**. "Basis" says who decided and when; **a proposal or an assistant's default is not recorded as accepted** unless the team said so. Older decisions are superseded, not rewritten. Dates are `YYYY-MM-DD`.

| ID | Decision | Status |
| --- | --- | --- |
| [D-01](#d-01) | Static browser app with three.js; no backend | Accepted |
| [D-02](#d-02) | Bake OpenStreetMap data once; no Google 3D tiles or map API key | Accepted |
| [D-03](#d-03) | Real routes from OSRM (one-way aware) | Accepted · supersedes the first in-app router |
| [D-04](#d-04) | APU's published timetable drives every trip | Accepted · supersedes the mock timetable |
| [D-05](#d-05) | Parkhill from its front gate; LRT via Jalan Barat; generalised rerouting | Accepted · supersedes the slide-9 LRT stop rule |
| [D-06](#d-06) | Modelled hourly traffic and crowds, not live data | Accepted (assumption) |
| [D-07](#d-07) | Telemetry in the team's BigQuery field names; Firebase optional and off | Accepted |
| [D-08](#d-08) | Supporting libraries | Accepted |
| [D-09](#d-09) | Crow's Foot (Mermaid) for the data model instead of Chen | Accepted — recorded departure |
| [D-10](#d-10) | Mermaid as the diagram format | Accepted |
| [D-11](#d-11) | "Ask SmartShuttle" and the Firebase live-sync card removed | Accepted |
| [D-12](#d-12) | Branch `feat/3d-map` pushed; no `main`; version 0.1.0 unreleased | Accepted |
| [D-13](#d-13) | Licence for the repository | **Open** |
| [D-14](#d-14) | Deploy to GitHub Pages with GitHub Actions | Implemented by Herbert — **not yet working** |

## D-01
**Context.** The demo must work from one link on any judge's laptop and must not break like the earlier Netlify prototype. **Decision.** A static Vite + three.js site; all logic runs in the browser. **Basis.** Gilbert approved the design on 2026-11-12 ("make like 3d mapping… you can use anything including three.js"). **Alternatives.** Google Photorealistic 3D Tiles (needs a billed API key, heavy); MapLibre extrusions (needs a tile source). **Consequences.** No server to run or secure; the page is a large single chunk (~530 kB gzip); everything is simulated.

## D-02
**Context.** Judges need a map of the real area without keys or billing. **Decision.** Download OpenStreetMap buildings and roads once with `pnpm bake` and commit the JSON. **Basis.** Approved with D-01. **Consequences.** Offline-capable; data is a snapshot (refresh with the bake script); ODbL attribution must stay visible.

## D-03
**Context.** The first router (own Dijkstra over OSM roads) ignored one-way streets and produced wrong routes. **Decision.** Bake real driving routes from the OSRM routing engine. **Basis.** Gilbert, 2026-11-12: "make real data of the route… so many one way route". **Supersedes** the in-app router (removed). **Consequences.** Routes follow one-way rules; re-baking depends on the public OSRM demo server; route quality is only as good as OpenStreetMap.

## D-04
**Context.** Mock departure times did not reflect APU. **Decision.** Use the *Campus Connect* schedule V1_20261022 (read from APU's published PDF) for every trip. **Basis.** Gilbert, 2026-11-12: "for the fix time bus it use real fix time schedule of apu". **Assumptions kept:** the LRT's "continuous pattern" is a bus every 6 min; fleet sizes and seats are guesses (APU does not publish them). **Consequences.** UniStay @ Kingston and Bayu Jalil are timetabled by APU but not yet mapped.

## D-05
**Context.** The deck's slide-9 rule had the Parkhill bus stop at the LRT. Gilbert corrected the geography. **Decision.** Parkhill leaves from its **front gate on Susur Jalil Sejahtera** (not the Jalan Teknologi 2 back lane); the LRT bus runs **via Jalan Barat (Endah side) onto the highway**; the smart-stop idea is **generalised** to any bus passing another route's crowded stop ([RULES R-10](../documentation/RULES.md)). **Basis.** Gilbert, 2026-11-12 ("parkhill not using that route, it using the front apartment route"; "the lrt use the highway route from endah"; "if one part is less people and another is crowded it can get reroute if its on the same route"). **Supersedes** the slide-9 LRT stop rule. **Consequence.** The pitch deck's slide 9 no longer matches the demo and should be updated.

## D-06
**Context.** No real crowd or traffic data exists. **Decision.** Model traffic and crowds by hour (KL rush hours, class-time peaks, students arriving in the 20 min before a trip) and label them as modelled everywhere. **Basis.** Gilbert, 2026-11-12: "add hour to add congestion", "on night it's not that crowded… use peak hour system". **Consequences.** Results illustrate the idea; they are not evidence about real APU demand. Real stop-box counts should replace the profiles.

## D-07
**Context.** The team created a BigQuery dataset and Firestore collections (2026-11-10). **Decision.** The simulation writes documents with the **same field names** as the BigQuery tables; Firebase live sync is **optional and off** unless `VITE_FIREBASE_*` is set. **Basis.** Gilbert asked for a Firebase calculations panel; no project config has been supplied. **Consequences.** Nothing is sent anywhere by default; the Firestore path is untested.

## D-08
**Context.** Features requested on 2026-11-12. **Decision / basis.** `driver.js` for the guided tour (requested: "add driver.js"); `@hugeicons/core-free-icons` for all icons (requested: "all emoji use hugeicons"); `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` for the webcam stop box, `qrcode` for the phone-view QR, `firebase` for optional sync (approved: "add all" after the feature list). All MIT or Apache-2.0. **Consequences.** The webcam feature downloads a model at run time; the bundle grew (~1.9 MB / ~530 kB gzip).

## D-09
**Context.** The mapping standard prefers **Chen** notation for conceptual ER models. **Decision.** Document the telemetry schema as a **Crow's Foot logical schema** using Mermaid `erDiagram`, and label it as such. **Rationale.** The team's own ER diagram is a relational (Crow's-Foot-style) schema of BigQuery tables, and the accepted renderer (Mermaid, [D-10](#d-10)) cannot draw Chen faithfully. **Alternative.** A Chen diagram in another tool — not produced; no new mapping dependency was adopted. **Consequence.** A conceptual Chen model of the domain (route, stop, trip, rider, queue) does not exist yet; add one if the data model grows.

## D-10
**Context.** The README must contain a mind map and GitHub should render it without extra tools. **Decision.** Use Mermaid in fenced blocks, with `.mmd` sources in `webtinousQA/maps/`. **Consequence.** The diagrams were **syntax-parsed**, not render-checked on GitHub.

## D-11
**Context.** An "Ask SmartShuttle" card (offline answers, optional Gemini) and a Firebase live-sync status card (with a switch for streaming raw events to Firestore) were added on 2026-11-12. **Decision.** Remove both. **Basis.** Gilbert, 2026-11-12 ("remove this", twice). **Consequences.** No AI/Gemini feature, no API-key handling, and no raw-event streaming to Firestore remain; the `live/state` snapshot for the phone view stays (config-gated).

## D-12
**Context.** The team repository `Earth177777/SmartBus-Shuttle` was empty. **Decision.** Push only the branch **`feat/3d-map`**; do not create or merge to `main`. **Basis.** Gilbert, 2026-11-10 ("mergenya jangan ke main") and 2026-11-12 ("push to git"). **Consequences.** GitHub shows `feat/3d-map` as the default branch because it is the only one. The version in `package.json` is **0.1.0** and **no tag or release exists**; the first release needs an accepted major/minor/patch decision first (MD.MD §9.1).

## D-13
**Open.** No licence file exists. The team should choose one (and confirm APU's rights over the timetable and names) before making the repository public. Until then the README states that no reuse permission is granted.

## D-14
**Context.** The portal needs a public demo URL. **Decision.** Build with GitHub Actions and publish `dist/` to GitHub Pages on every push to `feat/3d-map`. **Basis.** Herbert Valentino, commit `0ed77ff`, 2026-11-12 — the choice of hosting is his; it was recorded here, not decided by the documentation task. **Alternatives mentioned earlier.** Firebase Hosting (needs `firebase login`). **Status.** The first run ended in `startup_failure` and no Pages site existed when checked (2026-11-12). **Consequences.** Every push to this branch triggers a deployment attempt; the build uses pnpm 9 (the project was built on pnpm 11) and Node 20; the site uses relative asset paths (`base: './'`), which suit a project Pages URL.

