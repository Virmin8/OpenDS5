import { describe, expect, it } from 'vitest';
import { SignalWatch } from './signal-watch';

const S = 1000;
const weak = { connected: true, dbm: -26 };
const good = { connected: true, dbm: -12 };

/** Feeds the same reading every 500 ms from `from` to `to`; returns the times it warned. */
function feed(watch: SignalWatch, reading: { connected: boolean; dbm: number | null }, from: number, to: number): number[] {
  const warned: number[] = [];
  for (let t = from; t <= to; t += 500) {
    if (watch.update(reading, t)) warned.push(t);
  }
  return warned;
}

describe('SignalWatch', () => {
  it('warns once the link has been weak for a full minute', () => {
    const watch = new SignalWatch();
    expect(feed(watch, weak, 0, 59 * S)).toEqual([]);
    expect(feed(watch, weak, 59.5 * S, 120 * S)).toEqual([60 * S]);
  });

  it('ignores brief dips', () => {
    const watch = new SignalWatch();
    for (let minute = 0; minute < 5; minute++) {
      expect(feed(watch, weak, minute * 60 * S, minute * 60 * S + 30 * S)).toEqual([]);
      expect(feed(watch, good, minute * 60 * S + 30.5 * S, minute * 60 * S + 59.5 * S)).toEqual([]);
    }
  });

  it('warns again only after a good minute and at least 15 minutes later', () => {
    const watch = new SignalWatch();
    expect(feed(watch, weak, 0, 61 * S)).toEqual([60 * S]);
    // Recovers for a minute, then weak again soon after: still within 15 min.
    feed(watch, good, 61.5 * S, 125 * S);
    expect(feed(watch, weak, 125.5 * S, 300 * S)).toEqual([]);
    // Much later, after another good minute, it can warn again.
    feed(watch, good, 300.5 * S, 400 * S);
    expect(feed(watch, weak, 1000 * S, 1100 * S)).toEqual([1060 * S]);
  });

  it('does nothing without a controller or a reading', () => {
    const watch = new SignalWatch();
    expect(feed(watch, { connected: false, dbm: -40 }, 0, 120 * S)).toEqual([]);
    expect(feed(watch, { connected: true, dbm: null }, 0, 120 * S)).toEqual([]);
  });
});
