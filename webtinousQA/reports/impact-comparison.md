# Impact comparison — APU today vs SmartShuttle

> **Webtinous · by Continous Group** — generated record. **Do not edit by hand:** regenerate with `pnpm report:impact`.

**Generated:** 2026-11-12 · **Source:** commit `a0e339c` · **Generator:** `scripts/impact-report.mjs` → `src/sim/compare.js` · **Seed:** 4

**Evidence label:** Derived — produced by the simulation from the baked timetable, routes and the modelled crowd/traffic profiles. These are **simulated** results, not measurements of real APU students or buses.

## What is compared

- **APU today:** the published Campus Connect timetable only — no extra buses, no rerouting.
- **SmartShuttle:** the same timetable plus spare buses for overflowing lines and rerouting through other routes' crowded stops (rules in [RULES.md](../documentation/RULES.md)).
- Both runs use the same students (same random seed and arrival rules), fleet and traffic. Someone still in line when service ends counts as waiting until they would give up after 60 minutes.

## Average wait and people left without a bus

| Day | Avg wait today → SmartShuttle (min) | Change | Never got a bus today → SmartShuttle | Waited over 30 min today → SmartShuttle |
| --- | ---: | ---: | ---: | ---: |
| Normal day | 13.8 → **10.2** | -26% | 135 → **9** | 267 → 80 |
| Exam week | 32.7 → **21.4** | -34% | 186 → **0** | 2252 → 1442 |
| Heavy rain | 42.9 → **27.7** | -35% | 440 → **0** | 2854 → 2640 |
| Stadium event | 22.0 → **21.4** | -3% | 585 → **68** | 764 → 993 |
| LRT delay | 55.0 → **33.1** | -40% | 289 → **9** | 1962 → 1840 |

## Cost and carrying

| Day | Riders carried today → SmartShuttle | Bus-km today → SmartShuttle | Extra buses called | Reroutes | Left behind by a full bus (today → SmartShuttle) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal day | 5219 → 5345 | 1715 → 1794 | 13 | 0 | 1773 → 1438 |
| Exam week | 5658 → 5844 | 1715 → 1852 | 16 | 0 | 3877 → 3298 |
| Heavy rain | 6573 → 7015 | 1691 → 1858 | 20 | 3 | 4911 → 4648 |
| Stadium event | 5283 → 5800 | 1715 → 1839 | 20 | 3 | 2754 → 2780 |
| LRT delay | 5664 → 5944 | 1715 → 1835 | 17 | 0 | 3312 → 3173 |

## Reading these results honestly

- "Left behind" counts each person once, the first time a full bus pulls away without them.
- Where SmartShuttle does not improve a measure, the table shows it — see any row whose change is positive for waits or "waited over 30 min".
- Extra buses are modelled as spare vehicles already available to APU; their cost is shown only as extra bus-km. Fleet sizes per route are assumptions (APU does not publish them) — see [DATA.md](../documentation/DATA.md).
- The crowd and traffic profiles are modelled by hour of day, not measured. Replace them with real counts from the stop boxes before drawing planning conclusions.
