import { describe, it, expect } from 'vitest';
import { formatClock, formatWait } from '../src/ui/format.js';

describe('formatClock', () => {
  it('formats morning, noon, evening and midnight as h:mm AM/PM', () => {
    expect(formatClock(7 * 3600)).toBe('7:00 AM');
    expect(formatClock(12 * 3600 + 5 * 60)).toBe('12:05 PM');
    expect(formatClock(17 * 3600 + 42 * 60 + 59)).toBe('5:42 PM');
    expect(formatClock(22 * 3600)).toBe('10:00 PM');
    expect(formatClock(0)).toBe('12:00 AM');
  });
});

describe('formatWait', () => {
  it('shows minutes under an hour and hours + minutes above', () => {
    expect(formatWait(0)).toBe('now');
    expect(formatWait(12)).toBe('12 min');
    expect(formatWait(60)).toBe('1 h');
    expect(formatWait(215)).toBe('3 h 35 min');
  });
});
