import { describe, it, expect } from 'vitest';
import { needsExtraBus } from '../src/sim/rules.js';


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
