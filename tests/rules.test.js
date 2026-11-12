import { describe, it, expect } from 'vitest';
import { shouldStopAtLrt, needsExtraBus } from '../src/sim/rules.js';
import { arrivalsPerMinute } from '../src/sim/arrivals.js';

const ok = { lrtQueue: 50, nextLrtBusSeats: 40, freeSeats: 10, viaLrtEtaSec: 600, promisedEtaSec: 660 };

describe('shouldStopAtLrt (pitch slide 9)', () => {
  it('stops when all three conditions hold', () => {
    expect(shouldStopAtLrt(ok)).toBe(true);
  });
  it('skips when the LRT queue fits on the next LRT bus', () => {
    expect(shouldStopAtLrt({ ...ok, lrtQueue: 40 })).toBe(false);
  });
  it('skips when this bus has no free seats', () => {
    expect(shouldStopAtLrt({ ...ok, freeSeats: 0 })).toBe(false);
  });
  it('skips when stopping would break the promised ETA', () => {
    expect(shouldStopAtLrt({ ...ok, viaLrtEtaSec: 661 })).toBe(false);
  });
});

describe('needsExtraBus', () => {
  it('calls a 2nd bus when the line is longer than one bus', () => {
    expect(needsExtraBus(41, 40, false)).toBe(true);
  });
  it('does not call another while one is in flight', () => {
    expect(needsExtraBus(41, 40, true)).toBe(false);
  });
  it('does not call one when the line exactly fits', () => {
    expect(needsExtraBus(40, 40, false)).toBe(false);
  });
});

describe('arrivalsPerMinute', () => {
  it('peaks at the LRT in the morning and evening rush', () => {
    expect(arrivalsPerMinute('lrt', 8)).toBe(6);
    expect(arrivalsPerMinute('lrt', 18)).toBe(6);
    expect(arrivalsPerMinute('lrt', 12)).toBe(2);
  });
  it('matches the plan for Parkhill and APU', () => {
    expect(arrivalsPerMinute('parkhill', 7)).toBe(2);
    expect(arrivalsPerMinute('parkhill', 13)).toBe(0.5);
    expect(arrivalsPerMinute('apu', 16)).toBe(4);
    expect(arrivalsPerMinute('apu', 10)).toBe(1);
  });
});
