# Maps and mind maps

> **Webtinous · by Continous Group** — map directory (MAPPING.MD / `webtinousstandard.md` §6). Back to the [QA index](../README.md).

All maps are **Mermaid** sources (`.mmd`), which GitHub renders from a fenced ```` ```mermaid ```` block. No separate rendered image is kept; the source *is* the render. The four blocks below are the same text as the `.mmd` files — when a map changes, update the `.mmd` file and the block in the document that embeds it.

**Scope of every map:** the repository at the commit named in the [evidence record](../evidence/verification-2026-11-12.md) (branch `feat/3d-map`). **State shown:** current behaviour unless a row says otherwise.

| Map / question answered | Type and notation | Scope / source revision | Editable source | Render | Verification / limits | Updated / owner |
| --- | --- | --- | --- | --- | --- | --- |
| What is the idea and how does the workflow fit together? | Mind map — Mermaid `mindmap` (topic hierarchy) | Whole product; documented intent plus built features | [workflow-mindmap.mmd](workflow-mindmap.mmd) | Embedded in the [root README](../../README.md#how-the-idea-works) | **Syntax parsed** with Mermaid 11 (2026-11-12). Not render-checked on GitHub. Topic hierarchy only — not a data or authority model. | 2026-11-12 · SmartShuttle team |
| Which components exist and what crosses their boundaries? | Component / context diagram — Mermaid `flowchart` with labelled boundaries (build time, browser, optional cloud) | `src/`, `scripts/`, external services named in [DECISIONS](../decisions/README.md) | [architecture-components.mmd](architecture-components.mmd) | Embedded in [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) | **Source-confirmed** against imports and fetch calls; syntax parsed. Shows source structure and intended runtime links, not measured traffic. | 2026-11-12 · SmartShuttle team |
| What documents does the system write, and how do they relate? | **Logical schema — Crow's Foot** (Mermaid `erDiagram`) | The four telemetry collections written by `src/sim/telemetry.js` plus `routes` / `stops` from the team's BigQuery dataset | [data-model-crowsfoot.mmd](data-model-crowsfoot.mmd) | Embedded in [DATA.md](../documentation/DATA.md#telemetry-collections) | **Not Chen.** Mermaid cannot express Chen faithfully; this departure from the Chen preference is recorded in [decision D-09](../decisions/README.md). Cardinalities are *Documented intent* from the team's 2026-11-10 ER diagram; no database enforces them in this repository. Syntax parsed. | 2026-11-12 · SmartShuttle team |
| When does a bus reroute or a spare bus get called? | Activity / decision flow — Mermaid `flowchart` | `src/sim/reroute.js`, `src/sim/sim.js` | [decision-flow.mmd](decision-flow.mmd) | Embedded in [RULES.md](../documentation/RULES.md#the-two-dispatch-decisions) | **Test-confirmed** thresholds (see RULES.md); syntax parsed. | 2026-11-12 · SmartShuttle team |

## Legends

- **Flowcharts:** rounded boxes are components or steps, cylinders are stored data, stadium shapes are external services, dashed arrows are optional or internet-dependent links, diamonds are decisions.
- **Crow's Foot (`erDiagram`):** `||` exactly one, `o{` zero or many, `PK` primary key, `FK` foreign key. These are **logical** relationships between documents/tables; Firestore and the simulation do not enforce foreign keys.
- **Mind map:** one root, branches are topics; it has no relationship semantics.

## Unknowns

- The team's real BigQuery dataset (`smart-shuttle-apu.smartshuttle`) has not been inspected from this repository. The columns for `routes`, `stops` and the three event tables come from screenshots shared in the team chat on 2026-11-10; this repository's simulation writes `route_id` on `queue_events` (not in those screenshots) and does not write `routes` or `stops` documents.
