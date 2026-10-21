import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatTimeLeft, formatTimeLeftShort } from '../shared/battery-time';
import { BatteryEstimator, loadBatteryState, saveBatteryState } from './battery-estimator';

const MIN = 60_000;
const on = (percent: number) => ({ connected: true, percent, charging: false });

describe('BatteryEstimator', () => {
  it('learns nothing until it has timed a whole 10% step', () => {
    const est = new BatteryEstimator();
    est.update(on(80), 0);
    expect(est.update(on(70), 30 * MIN)).toBe(false); // when 80% began is unknown
    expect(est.minutesLeft(on(70), 30 * MIN)).toBeNull();
    expect(est.update(on(60), 70 * MIN)).toBe(true); // 70% lasted 40 min
    expect(est.getState()).toEqual({ minutesPerStep: 40, steps: 1 });
  });

  it('estimates from the learned rate, minus time spent in the current step', () => {
    const est = new BatteryEstimator({ minutesPerStep: 40, steps: 5 });
    est.update(on(60), 0);
    expect(est.minutesLeft(on(60), 0)).toBe(240);
    est.update(on(50), 10 * MIN); // a drop: 50% starts now
    expect(est.minutesLeft(on(50), 25 * MIN)).toBe(200 - 15);
  });

  it('averages new steps in gradually', () => {
    const est = new BatteryEstimator({ minutesPerStep: 40, steps: 5 });
    est.update(on(60), 0);
    est.update(on(50), 1 * MIN);
    est.update(on(40), 61 * MIN); // a 60 min step
    expect(est.getState().minutesPerStep).toBeCloseTo(46);
  });

  it('ignores steps too short or too long to be normal play', () => {
    const est = new BatteryEstimator();
    est.update(on(80), 0);
    est.update(on(70), 1 * MIN);
    expect(est.update(on(60), 2 * MIN)).toBe(false); // 1 min
    expect(est.update(on(50), 400 * MIN)).toBe(false); // ~6.6 h idle
    expect(est.getState().minutesPerStep).toBeNull();
  });

  it('stops while charging or disconnected and starts over afterwards', () => {
    const est = new BatteryEstimator({ minutesPerStep: 30, steps: 3 });
    est.update(on(50), 0);
    expect(est.minutesLeft({ connected: true, percent: 50, charging: true }, 0)).toBeNull();
    est.update({ connected: true, percent: 60, charging: true }, 10 * MIN);
    est.update(on(60), 20 * MIN);
    expect(est.update(on(50), 50 * MIN)).toBe(false); // when 60% began is unknown
    expect(est.minutesLeft({ connected: false, percent: null, charging: false }, 0)).toBeNull();
  });

  it('saves and loads what it learned', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-battery-'));
    try {
      expect(loadBatteryState(dir)).toEqual({ minutesPerStep: null, steps: 0 });
      saveBatteryState(dir, { minutesPerStep: 42.5, steps: 7 });
      expect(loadBatteryState(dir)).toEqual({ minutesPerStep: 42.5, steps: 7 });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('formatTimeLeft', () => {
  it('rounds to what is worth saying', () => {
    expect(formatTimeLeft(4)).toBe('under 10 min');
    expect(formatTimeLeft(42)).toBe('about 40 min');
    expect(formatTimeLeft(95)).toBe('about 1.5 h');
    expect(formatTimeLeft(120)).toBe('about 2 h');
    expect(formatTimeLeft(250)).toBe('about 4 h');
    expect(formatTimeLeftShort(250)).toBe('~4 h');
    expect(formatTimeLeftShort(4)).toBe('<10 min');
  });
});
