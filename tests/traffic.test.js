import { describe, it, expect } from 'vitest';
import { trafficFactor, trafficLevel } from '../src/sim/traffic.js';
import { demandPerMinute } from '../src/sim/demand.js';

const h = (hours) => hours * 3600;

describe('trafficFactor (KL weekday profile)', () => {
  it('peaks in the morning and evening rush', () => {
    expect(trafficFactor(h(8))).toBeCloseTo(1.9, 6);
    expect(trafficFactor(h(18))).toBeCloseTo(2.1, 6);
  });
  it('is lighter at midday and close to free-flow at night', () => {
    expect(trafficFactor(h(11))).toBeCloseTo(1.15, 6);
    expect(trafficFactor(h(22))).toBeLessThan(1.1);
    expect(trafficFactor(h(3))).toBe(1);
  });
  it('ramps smoothly into the rush', () => {
    expect(trafficFactor(h(7.25))).toBeCloseTo(1.65, 6);
  });
});

describe('trafficLevel', () => {
  it('labels light, moderate and heavy traffic', () => {
    expect(trafficLevel(1.0)).toBe('Light');
    expect(trafficLevel(1.4)).toBe('Moderate');
    expect(trafficLevel(2.1)).toBe('Heavy');
  });
});

describe('demandPerMinute (peak-hour system)', () => {
  const line = { demand: 6 };
  it('sends students to APU hardest in the morning peak', () => {
    expect(demandPerMinute(line, 'out', h(8))).toBeCloseTo(6, 6);
  });
  it('has almost nobody heading to APU at night', () => {
    expect(demandPerMinute(line, 'out', h(21))).toBeLessThan(0.1);
  });
  it('sends students home hardest in the evening peak', () => {
    expect(demandPerMinute(line, 'back', h(17.5))).toBeCloseTo(6, 6);
  });
  it('has nobody going home first thing in the morning', () => {
    expect(demandPerMinute(line, 'back', h(8))).toBeLessThan(0.3);
  });
  it('is quiet late at night', () => {
    expect(demandPerMinute(line, 'back', h(21.5))).toBeLessThan(1);
  });
});
