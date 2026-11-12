// Generates webtinousQA/reports/impact-comparison.md: the same weekday run as APU runs it
// today and with SmartShuttle, for every scenario. Source of truth: src/sim/compare.js.
// Usage: pnpm report:impact
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { compareDays } from '../src/sim/compare.js';
import { SCENARIOS } from '../src/sim/scenarios.js';
import { LINES } from '../src/data/lines.js';

const SEED = 4;
const routes = JSON.parse(readFileSync(new URL('../src/data/routes.json', import.meta.url)));
const sha = (() => { try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();
const dirty = (() => { try { return execSync('git status --porcelain -- src scripts', { encoding: 'utf8' }).trim() ? ' (+ uncommitted changes)' : ''; } catch { return ''; } })();
const today = new Date().toISOString().slice(0, 10);

const pct = (a, b) => (a === 0 ? (b === 0 ? '0%' : 'n/a') : `${b - a > 0 ? '+' : ''}${Math.round((100 * (b - a)) / a)}%`);
const rows = SCENARIOS.map((s) => ({ s, c: compareDays(LINES, routes, { seed: SEED, scenario: s.id }) }));

const lines = [];
lines.push('# Impact comparison — APU today vs SmartShuttle', '');
lines.push('> **Webtinous · by Continous Group** — generated record. **Do not edit by hand:** regenerate with `pnpm report:impact`.', '');
lines.push(`**Generated:** ${today} · **Source:** commit \`${sha}\`${dirty} · **Generator:** \`scripts/impact-report.mjs\` → \`src/sim/compare.js\` · **Seed:** ${SEED}`, '');
lines.push('**Evidence label:** Derived — produced by the simulation from the baked timetable, routes and the modelled crowd/traffic profiles. These are **simulated** results, not measurements of real APU students or buses.', '');
lines.push('## What is compared', '');
lines.push('- **APU today:** the published Campus Connect timetable only — no extra buses, no rerouting.');
lines.push('- **SmartShuttle:** the same timetable plus spare buses for overflowing lines and rerouting through other routes\' crowded stops (rules in [RULES.md](../documentation/RULES.md)).');
lines.push('- Both runs use the same students (same random seed and arrival rules), fleet and traffic. Someone still in line when service ends counts as waiting until they would give up after 60 minutes.', '');
lines.push('## Average wait and people left without a bus', '');
lines.push('| Day | Avg wait today → SmartShuttle (min) | Change | Never got a bus today → SmartShuttle | Waited over 30 min today → SmartShuttle |');
lines.push('| --- | ---: | ---: | ---: | ---: |');
for (const { s, c } of rows) {
  lines.push(`| ${s.name} | ${c.today.avgWaitMin.toFixed(1)} → **${c.smart.avgWaitMin.toFixed(1)}** | ${pct(c.today.avgWaitMin, c.smart.avgWaitMin)} | ${c.today.stranded} → **${c.smart.stranded}** | ${c.today.waitedOver30} → ${c.smart.waitedOver30} |`);
}
lines.push('', '## Cost and carrying', '');
lines.push('| Day | Riders carried today → SmartShuttle | Bus-km today → SmartShuttle | Extra buses called | Reroutes | Left behind by a full bus (today → SmartShuttle) |');
lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
for (const { s, c } of rows) {
  lines.push(`| ${s.name} | ${c.today.riders} → ${c.smart.riders} | ${Math.round(c.today.busKm)} → ${Math.round(c.smart.busKm)} | ${c.smart.extraBuses} | ${c.smart.reroutes} | ${c.today.leftBehind} → ${c.smart.leftBehind} |`);
}
lines.push('', '## Reading these results honestly', '');
lines.push('- "Left behind" counts each person once, the first time a full bus pulls away without them.');
lines.push('- Where SmartShuttle does not improve a measure, the table shows it — see any row whose change is positive for waits or "waited over 30 min".');
lines.push('- Extra buses are modelled as spare vehicles already available to APU; their cost is shown only as extra bus-km. Fleet sizes per route are assumptions (APU does not publish them) — see [DATA.md](../documentation/DATA.md).');
lines.push('- The crowd and traffic profiles are modelled by hour of day, not measured. Replace them with real counts from the stop boxes before drawing planning conclusions.', '');

mkdirSync(new URL('../webtinousQA/reports/', import.meta.url), { recursive: true });
writeFileSync(new URL('../webtinousQA/reports/impact-comparison.md', import.meta.url), lines.join('\n'));
console.log(lines.slice(8, 8 + 8 + rows.length).join('\n'));
