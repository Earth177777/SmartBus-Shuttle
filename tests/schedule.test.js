import { describe, it, expect } from 'vitest';
import { parseTime, buildDepartures, pickupOffsetSec } from '../src/sim/schedule.js';
import { LINES } from '../src/data/lines.js';

const lrt = LINES.find((l) => l.id === 'lrt');
const bv = LINES.find((l) => l.id === 'bloomsvale');

describe('parseTime', () => {
  it('reads HH:MM as seconds since midnight', () => {
    expect(parseTime('07:30')).toEqual({ t: 27000, limited: false });
    expect(parseTime('18:20')).toEqual({ t: 66000, limited: false });
  });
  it('reads ** as limited space', () => {
    expect(parseTime('**20:45')).toEqual({ t: 74700, limited: true });
  });
});

describe('buildDepartures (APU schedule V1_20261022)', () => {
  const deps = buildDepartures(lrt);
  const out = deps.filter((d) => d.dir === 'out');
  const back = deps.filter((d) => d.dir === 'back');

  it('keeps all 40 LRT→APU and 39 APU→LRT timetabled trips', () => {
    expect(out.filter((d) => !d.continuous)).toHaveLength(40);
    expect(back).toHaveLength(39);
  });
  it('fills the 7:30–8:45 continuous peak with a bus every 6 minutes', () => {
    const cont = out.filter((d) => d.continuous).map((d) => d.t);
    expect(cont[0]).toBe(parseTime('07:36').t);
    expect(cont.at(-1)).toBe(parseTime('08:42').t);
    expect(cont).toHaveLength(12);
  });
  it('marks the late APU→LRT trips as limited space', () => {
    expect(back.filter((d) => d.limited).map((d) => d.t)).toEqual([parseTime('20:45').t, parseTime('21:45').t]);
  });
  it('is sorted by time', () => {
    const ts = deps.map((d) => d.t);
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
  });
});

describe('pickupOffsetSec', () => {
  it('gives Harmony its 10-minute offset after Bloomsvale', () => {
    expect(pickupOffsetSec(bv, 'bloomsvale')).toBe(0);
    expect(pickupOffsetSec(bv, 'harmony')).toBe(600);
  });
});
