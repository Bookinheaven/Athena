// ─────────────────────────────────────────────────────────────────────────────
// WallClockTimer
//
// A pure wall-clock timer abstraction.
// No React. No side-effects beyond internal state mutations.
//
// Elapsed time is computed from start/pause timestamps rather than
// accumulated RAF ticks.  This makes it accurate through:
//   - background tabs (RAF is throttled; we are not)
//   - system sleep
//   - tab suspend / restoration
//   - delayed frames
// ─────────────────────────────────────────────────────────────────────────────

export class WallClockTimer {
  /**
   * @param {number} [initialElapsedMs=0]  – Previously accumulated ms.
   */
  constructor(initialElapsedMs = 0) {
    /** @type {number | null} */
    this._startTime   = null;

    /** @type {number} Accumulated ms at time of last pause */
    this._baseMs      = initialElapsedMs;

    /** @type {boolean} */
    this.running      = false;
  }

  // ── Control ─────────────────────────────────────────────────────────────────

  /**
   * Start (or resume) the timer.
   * @param {number} [atMs]  – Override start timestamp (for testing).
   */
  start(atMs = Date.now()) {
    if (this.running) return;
    this._startTime = atMs;
    this.running    = true;
  }

  /**
   * Pause the timer.  Accumulated time is folded into _baseMs.
   * @param {number} [atMs]  – Override pause timestamp (for testing).
   */
  pause(atMs = Date.now()) {
    if (!this.running) return;
    this._baseMs   += atMs - this._startTime;
    this._startTime = null;
    this.running    = false;
  }

  /**
   * Reset to zero (keeps the same object, allows reuse).
   */
  reset() {
    this._startTime = null;
    this._baseMs    = 0;
    this.running    = false;
  }

  /**
   * Warp the timer to a specific elapsed millisecond value.
   * Useful when restoring a session from a persisted snapshot.
   * If the timer is currently running it stays running from the new base.
   *
   * @param {number} newElapsedMs
   * @param {number} [atMs]
   */
  syncTo(newElapsedMs, atMs = Date.now()) {
    this._baseMs = newElapsedMs;
    if (this.running) {
      this._startTime = atMs;
    }
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  /**
   * Current elapsed milliseconds (wall-clock accurate).
   * @param {number} [atMs]  – Override "now" timestamp (for testing).
   * @returns {number}
   */
  getElapsedMs(atMs = Date.now()) {
    if (!this.running || this._startTime === null) {
      return this._baseMs;
    }
    return this._baseMs + (atMs - this._startTime);
  }

  /**
   * Current elapsed whole seconds.
   * @param {number} [atMs]
   * @returns {number}
   */
  getElapsedSeconds(atMs = Date.now()) {
    return Math.floor(this.getElapsedMs(atMs) / 1000);
  }
}
