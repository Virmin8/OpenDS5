import fs from 'node:fs';
import path from 'node:path';

/** The controller reports battery in 10% steps. */
const STEP_PERCENT = 10;
/** Steps shorter or longer than this aren't normal play (a reconnect glitch, or left idle). */
const MIN_STEP_MINUTES = 3;
const MAX_STEP_MINUTES = 240;
/** How quickly the learned rate follows new steps (0..1). */
const LEARN_WEIGHT = 0.3;

export interface BatteryEstimatorState {
  /** Learned average minutes per 10% step on battery, or null before any. */
  minutesPerStep: number | null;
  /** How many steps went into it. */
  steps: number;
}

/**
 * Estimates play time left from how long each 10% battery step lasts. The
 * controller only reports whole steps, so it times the gap between two drops,
 * keeps a running average across sessions, and subtracts the time already
 * spent in the current step.
 */
export class BatteryEstimator {
  private level: number | null = null;
  /** When the current level started (a drop was seen), or null if not known. */
  private levelSince: number | null = null;

  constructor(private state: BatteryEstimatorState = { minutesPerStep: null, steps: 0 }) {}

  getState(): BatteryEstimatorState {
    return { ...this.state };
  }

  /**
   * Feed the latest reading. Returns true when the learned rate changed and
   * should be saved.
   */
  update(reading: { connected: boolean; percent: number | null; charging: boolean }, now: number): boolean {
    if (!reading.connected || reading.percent === null || reading.charging) {
      this.level = null;
      this.levelSince = null;
      return false;
    }
    const percent = reading.percent;
    if (this.level === null || percent > this.level) {
      // First reading, or it went up (charged while we weren't looking):
      // we don't know when this level started.
      this.level = percent;
      this.levelSince = null;
      return false;
    }
    if (percent === this.level) {
      return false;
    }
    let learned = false;
    const steps = Math.max(1, Math.round((this.level - percent) / STEP_PERCENT));
    if (this.levelSince !== null) {
      const minutes = (now - this.levelSince) / 60000 / steps;
      if (minutes >= MIN_STEP_MINUTES && minutes <= MAX_STEP_MINUTES) {
        const previous = this.state.minutesPerStep;
        this.state = {
          minutesPerStep: previous === null ? minutes : previous + LEARN_WEIGHT * (minutes - previous),
          steps: this.state.steps + 1
        };
        learned = true;
      }
    }
    this.level = percent;
    this.levelSince = now;
    return learned;
  }

  /** Minutes of play left, or null when there's nothing to go on. */
  minutesLeft(reading: { connected: boolean; percent: number | null; charging: boolean }, now: number): number | null {
    const perStep = this.state.minutesPerStep;
    if (!reading.connected || reading.percent === null || reading.charging || perStep === null) {
      return null;
    }
    const elapsed = this.levelSince === null ? 0 : (now - this.levelSince) / 60000;
    // The current step has between nothing and a full step left; assume what
    // the average says, minus what has already gone.
    const left = (reading.percent / STEP_PERCENT) * perStep - Math.min(elapsed, perStep);
    return Math.max(0, Math.round(left));
  }
}

const STATE_FILE = 'battery-stats.json';

export function loadBatteryState(userDataDir: string): BatteryEstimatorState {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(userDataDir, STATE_FILE), 'utf8')) as Partial<BatteryEstimatorState>;
    if (typeof value.minutesPerStep === 'number' && value.minutesPerStep > 0 && typeof value.steps === 'number') {
      return { minutesPerStep: value.minutesPerStep, steps: value.steps };
    }
  } catch {
    // none saved yet
  }
  return { minutesPerStep: null, steps: 0 };
}

export function saveBatteryState(userDataDir: string, state: BatteryEstimatorState): void {
  try {
    fs.writeFileSync(path.join(userDataDir, STATE_FILE), `${JSON.stringify(state)}\n`);
  } catch (error) {
    console.warn('Saving battery stats failed:', error);
  }
}
