/** Below this the app rates the link "Audio Risk": haptics and audio may stutter. */
export const WEAK_SIGNAL_DBM = -22;
/** How long it has to stay weak, or good again, before it counts. */
const SUSTAIN_MS = 60_000;
/** At most one warning per this long. */
const REPEAT_MS = 15 * 60_000;

/**
 * Decides when a weak Bluetooth link is worth a notification: weak for a
 * full minute, once per weak spell (good again for a minute re-arms it),
 * and not more than every 15 minutes. Brief dips never count.
 */
export class SignalWatch {
  private weakSince: number | null = null;
  private goodSince: number | null = null;
  private armed = true;
  private lastWarnedAt = -Infinity;

  /** Returns true when a warning should be shown now. */
  update(reading: { connected: boolean; dbm: number | null }, now: number): boolean {
    if (!reading.connected || reading.dbm === null) {
      this.weakSince = null;
      this.goodSince = null;
      return false;
    }
    if (reading.dbm < WEAK_SIGNAL_DBM) {
      this.goodSince = null;
      this.weakSince ??= now;
      if (this.armed && now - this.weakSince >= SUSTAIN_MS && now - this.lastWarnedAt >= REPEAT_MS) {
        this.armed = false;
        this.lastWarnedAt = now;
        return true;
      }
      return false;
    }
    this.weakSince = null;
    this.goodSince ??= now;
    if (now - this.goodSince >= SUSTAIN_MS) {
      this.armed = true;
    }
    return false;
  }
}
